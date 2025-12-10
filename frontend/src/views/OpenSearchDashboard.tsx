import React, { useState, useEffect } from 'react';
import { ViewHeader } from '../components/ViewHeader';
import { TacticalCard } from '../components/TacticalCard';
import { Database, Search, Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Eye, Download, Trash2, Filter, Calendar } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface IndexedDocument {
    id: string;
    filename: string;
    indexName: string;
    documentCount: number;
    size: string;
    status: 'indexed' | 'processing' | 'error';
    uploadedAt: string;
    category: string;
    fields: string[];
}

interface IndexStats {
    totalDocuments: number;
    totalIndices: number;
    totalSize: string;
    lastIndexed: string;
}

const OpenSearchDashboard: React.FC = () => {
    const toast = useToast();
    const [documents, setDocuments] = useState<IndexedDocument[]>([]);
    const [stats, setStats] = useState<IndexStats>({
        totalDocuments: 0,
        totalIndices: 0,
        totalSize: '0 MB',
        lastIndexed: '-',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<IndexedDocument | null>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            // Mock data для демонстрації
            const mockDocs: IndexedDocument[] = [
                {
                    id: '1',
                    filename: 'customs_declarations_march_2024.xlsx',
                    indexName: 'customs-declarations',
                    documentCount: 15420,
                    size: '237 MB',
                    status: 'indexed',
                    uploadedAt: '2024-12-07 06:25',
                    category: 'GOV',
                    fields: ['declaration_number', 'company_name', 'goods_description', 'value', 'currency'],
                },
                {
                    id: '2',
                    filename: 'companies_ukraine.csv',
                    indexName: 'companies',
                    documentCount: 245,
                    size: '732 B',
                    status: 'indexed',
                    uploadedAt: '2024-12-06 22:55',
                    category: 'BIZ',
                    fields: ['company_name', 'edrpou', 'address', 'activity_code'],
                },
            ];

            setDocuments(mockDocs);
            setStats({
                totalDocuments: mockDocs.reduce((sum, doc) => sum + doc.documentCount, 0),
                totalIndices: mockDocs.length,
                totalSize: '237.7 MB',
                lastIndexed: mockDocs[0]?.uploadedAt || '-',
            });
        } catch (error) {
            console.error('Error loading documents:', error);
            toast.error('Помилка', 'Не вдалося завантажити документи');
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            toast.info('Файл вибрано', file.name);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.warning('Помилка', 'Виберіть файл для завантаження');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('dataset_type', 'customs');

            // Симуляція прогресу
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            // Реальний upload
            const response = await api.uploadDataset(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);

            toast.success('Успіх!', `Файл ${selectedFile.name} успішно завантажено та проіндексовано`);

            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                setSelectedFile(null);
                loadDocuments();
            }, 1000);

        } catch (error: any) {
            console.error('Upload error:', error);
            setIsUploading(false);
            setUploadProgress(0);
            toast.error('Помилка', error.message || 'Не вдалося завантажити файл');
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цей документ?')) return;

        try {
            // await api.deleteDocument(docId);
            toast.success('Видалено', 'Документ успішно видалено');
            loadDocuments();
        } catch (error) {
            toast.error('Помилка', 'Не вдалося видалити документ');
        }
    };

    const getChartData = () => {
        return documents.map(doc => ({
            name: doc.filename.substring(0, 20) + '...',
            docs: doc.documentCount,
        }));
    };

    const renderUploadSection = () => (
        <TacticalCard title="Завантаження Файлів" className="panel-3d">
            <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-slate-700 hover:border-primary-500 rounded-lg transition-colors cursor-pointer bg-slate-900/50">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".xlsx,.xls,.csv,.json,.parquet"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center gap-3 cursor-pointer"
                    >
                        <Upload size={48} className="text-slate-600" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-300">
                                {selectedFile ? selectedFile.name : 'Натисніть для вибору файлу'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                XLSX, CSV, JSON, PARQUET (max 500MB)
                            </p>
                        </div>
                    </label>
                </div>

                {selectedFile && (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-primary-500" />
                                <span className="text-sm font-bold text-slate-300">{selectedFile.name}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>

                        {isUploading && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Завантаження та індексація...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold text-sm transition-all flex items-center justify-center gap-2 btn-3d btn-3d-blue"
                >
                    {isUploading ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Обробка...
                        </>
                    ) : (
                        <>
                            <Upload size={16} />
                            Завантажити та Проіндексувати
                        </>
                    )}
                </button>

                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        <strong className="text-primary-400">Процес:</strong> Файл завантажується до MinIO →
                        Парситься (Pandas/PyArrow) → Індексується в OpenSearch →
                        Векторизується (SentenceTransformers) → Зберігається в Qdrant →
                        Metadata в PostgreSQL
                    </p>
                </div>
            </div>
        </TacticalCard>
    );

    const renderStatsCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TacticalCard title="Всього Документів" className="panel-3d">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-primary-400 font-mono">
                            {stats.totalDocuments.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">записів в індексах</div>
                    </div>
                    <Database size={32} className="text-primary-500/30" />
                </div>
            </TacticalCard>

            <TacticalCard title="Індексів" className="panel-3d">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-success-400 font-mono">
                            {stats.totalIndices}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">активних індексів</div>
                    </div>
                    <Search size={32} className="text-success-500/30" />
                </div>
            </TacticalCard>

            <TacticalCard title="Загальний Розмір" className="panel-3d">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-warning-400 font-mono">
                            {stats.totalSize}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">даних</div>
                    </div>
                    <FileText size={32} className="text-warning-500/30" />
                </div>
            </TacticalCard>

            <TacticalCard title="Останнє Оновлення" className="panel-3d">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-lg font-bold text-slate-300 font-mono">
                            {stats.lastIndexed}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">timestamp</div>
                    </div>
                    <Calendar size={32} className="text-slate-500/30" />
                </div>
            </TacticalCard>
        </div>
    );

    const renderDocumentsList = () => (
        <TacticalCard title="Проіндексовані Документи" className="panel-3d">
            <div className="space-y-3">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="p-4 bg-slate-900 border border-slate-800 hover:border-primary-500/30 rounded-lg transition-all cursor-pointer group"
                        onClick={() => setSelectedDocument(doc)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={16} className="text-primary-500" />
                                    <span className="font-bold text-slate-200">{doc.filename}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${doc.status === 'indexed' ? 'bg-success-500/20 text-success-500' :
                                            doc.status === 'processing' ? 'bg-warning-500/20 text-warning-500' :
                                                'bg-danger-500/20 text-danger-500'
                                        }`}>
                                        {doc.status === 'indexed' ? 'Indexed' : doc.status === 'processing' ? 'Processing' : 'Error'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Index: <span className="text-primary-400 font-mono">{doc.indexName}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDocument(doc);
                                    }}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                    title="Переглянути деталі"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(doc.id);
                                    }}
                                    className="p-2 bg-slate-800 hover:bg-danger-500/20 rounded text-slate-400 hover:text-danger-500 transition-colors"
                                    title="Видалити"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                                <span className="text-slate-500">Документів:</span>
                                <span className="ml-2 text-slate-300 font-mono">{doc.documentCount.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Розмір:</span>
                                <span className="ml-2 text-slate-300 font-mono">{doc.size}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Завантажено:</span>
                                <span className="ml-2 text-slate-300 font-mono">{doc.uploadedAt}</span>
                            </div>
                        </div>

                        {doc.fields && (
                            <div className="mt-3 pt-3 border-t border-slate-800">
                                <div className="text-[10px] text-slate-500 mb-1">Поля:</div>
                                <div className="flex flex-wrap gap-1">
                                    {doc.fields.map((field, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-mono"
                                        >
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {documents.length === 0 && (
                    <div className="py-12 text-center text-slate-500">
                        <Database size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Немає проіндексованих документів</p>
                        <p className="text-xs mt-2">Завантажте файл для початку</p>
                    </div>
                )}
            </div>
        </TacticalCard>
    );

    const renderChart = () => (
        <TacticalCard title="Розподіл Документів" className="panel-3d">
            <div className="h-[300px]">
                <ReactECharts
                    option={{
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: { type: 'shadow' },
                        },
                        grid: { top: 20, bottom: 40, left: 60, right: 20 },
                        xAxis: {
                            type: 'category',
                            data: getChartData().map(d => d.name),
                            axisLabel: {
                                color: '#94a3b8',
                                fontSize: 11,
                                rotate: 45,
                            },
                        },
                        yAxis: {
                            type: 'value',
                            axisLabel: { color: '#94a3b8' },
                            splitLine: { lineStyle: { color: '#1e293b' } },
                        },
                        series: [{
                            name: 'Документів',
                            type: 'bar',
                            data: getChartData().map(d => d.docs),
                            itemStyle: {
                                color: {
                                    type: 'linear',
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [
                                        { offset: 0, color: '#06b6d4' },
                                        { offset: 1, color: '#0891b2' },
                                    ],
                                },
                            },
                        }],
                    }}
                    style={{ height: '100%', width: '100%' }}
                    theme="dark"
                />
            </div>
        </TacticalCard>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto">
            <ViewHeader
                title="OpenSearch Dashboard"
                icon={<Database size={20} className="icon-3d-purple" />}
                breadcrumbs={['DATA', 'OPENSEARCH']}
                stats={[
                    { label: 'Документів', value: stats.totalDocuments.toString(), icon: <FileText size={14} />, color: 'primary' },
                    { label: 'Індексів', value: stats.totalIndices.toString(), icon: <Database size={14} />, color: 'success' },
                    { label: 'Розмір', value: stats.totalSize, icon: <Search size={14} />, color: 'default' },
                ]}
                actions={[
                    <button
                        key="refresh"
                        onClick={loadDocuments}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="Оновити"
                    >
                        <RefreshCw size={20} />
                    </button>,
                ]}
            />

            {renderStatsCards()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    {renderUploadSection()}
                </div>
                <div className="lg:col-span-2">
                    {renderChart()}
                </div>
            </div>

            {renderDocumentsList()}
        </div>
    );
};

export default OpenSearchDashboard;
