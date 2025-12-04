'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getSeverityColor } from '@/lib/utils';

interface Department {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

interface AIAnalysis {
    suggestedSeverity: string;
    summary: string;
    recommendedActions: string[];
}

export default function NewIncidentPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'MEDIUM',
        categoryId: '',
        departmentId: session?.user?.departmentId || '',
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [deptRes, catRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/categories'),
                ]);

                if (deptRes.ok) {
                    const depts = await deptRes.json();
                    setDepartments(depts);
                }
                if (catRes.ok) {
                    const cats = await catRes.json();
                    setCategories(cats);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (session?.user?.departmentId && !formData.departmentId) {
            setFormData(prev => ({ ...prev, departmentId: session.user.departmentId || '' }));
        }
    }, [session, formData.departmentId]);

    const handleAIAnalysis = async () => {
        if (!formData.title || !formData.description) {
            setError('Please enter a title and description first');
            return;
        }

        setAnalyzing(true);
        setError('');

        try {
            const category = categories.find(c => c.id === formData.categoryId);
            const department = departments.find(d => d.id === formData.departmentId);

            const response = await fetch('/api/ai/incidents/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    category: category?.name,
                    department: department?.name,
                }),
            });

            if (response.ok) {
                const analysis = await response.json();
                setAiAnalysis(analysis);
                // Auto-apply suggested severity
                setFormData(prev => ({ ...prev, severity: analysis.suggestedSeverity }));
            } else {
                setError('Failed to analyze incident. Please try again.');
            }
        } catch (error) {
            setError('Failed to connect to AI service');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    categoryId: formData.categoryId || null,
                    aiSummary: aiAnalysis?.summary,
                    aiSeveritySuggestion: aiAnalysis?.suggestedSeverity,
                    aiRecommendedActions: aiAnalysis?.recommendedActions.join('\n'),
                }),
            });

            if (response.ok) {
                const incident = await response.json();
                router.push(`/incidents/${incident.id}`);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create incident');
            }
        } catch (error) {
            setError('Failed to create incident. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/incidents">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="size-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Report New Incident</h1>
                    <p className="text-muted-foreground">
                        Provide details about the incident for tracking and resolution
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Form */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Incident Details</CardTitle>
                                <CardDescription>
                                    Describe the incident with as much detail as possible
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {error && (
                                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Brief summary of the incident"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Provide a detailed description of what happened, when it occurred, and any relevant context..."
                                        className="min-h-32"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department *</Label>
                                        <Select
                                            value={formData.departmentId}
                                            onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="severity">Severity *</Label>
                                    <Select
                                        value={formData.severity}
                                        onValueChange={(v) => setFormData({ ...formData, severity: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="CRITICAL">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3">
                            <Link href="/incidents">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    'Submit Incident'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* AI Analysis Panel */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="size-5 text-purple-500" />
                                    AI Analysis
                                </CardTitle>
                                <CardDescription>
                                    Get AI-powered insights and recommendations
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleAIAnalysis}
                                    disabled={analyzing || !formData.title || !formData.description}
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="size-4 mr-2" />
                                            Analyze Incident
                                        </>
                                    )}
                                </Button>

                                {aiAnalysis && (
                                    <div className="space-y-4 animate-slide-up">
                                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="size-4 text-purple-600" />
                                                <span className="text-sm font-medium text-purple-800">
                                                    Suggested Severity
                                                </span>
                                            </div>
                                            <Badge className={getSeverityColor(aiAnalysis.suggestedSeverity)}>
                                                {aiAnalysis.suggestedSeverity}
                                            </Badge>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium mb-2">Summary</p>
                                            <p className="text-sm text-muted-foreground">
                                                {aiAnalysis.summary}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium mb-2">Recommended Actions</p>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                {aiAnalysis.recommendedActions.map((action, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-purple-500 mt-1">•</span>
                                                        {action}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
