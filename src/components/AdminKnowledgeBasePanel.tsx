import { useState, useEffect } from 'react';
import { Database, Plus, Search, Trash2, Edit, BookOpen, X, FileUp } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import {
  getAllKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
} from '../lib/adminApi';
import { Database as DB } from '../lib/database.types';
import { ConfirmDialog } from './ConfirmDialog';
import { format } from 'date-fns';

type KnowledgeBase = DB['public']['Tables']['knowledge_base']['Row'];
type DocumentType = KnowledgeBase['document_type'];

interface KnowledgeBaseFormData {
  title: string;
  content: string;
  document_type: DocumentType;
}

export function AdminKnowledgeBasePanel() {
  const [articles, setArticles] = useState<KnowledgeBase[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeBase | null>(null);
  const [formData, setFormData] = useState<KnowledgeBaseFormData>({
    title: '',
    content: '',
    document_type: 'nutrition_guideline',
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    articleId: string | null;
  }>({ isOpen: false, articleId: null });

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchTerm, typeFilter, articles]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getAllKnowledgeBase();
      setArticles(data);
      setFilteredArticles(data);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (searchTerm) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((article) => article.document_type === typeFilter);
    }

    setFilteredArticles(filtered);
  };

  const handleOpenModal = (article?: KnowledgeBase) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        content: article.content,
        document_type: article.document_type,
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        content: '',
        document_type: 'nutrition_guideline',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setFormData({
      title: '',
      content: '',
      document_type: 'nutrition_guideline',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    try {
      setLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      setFormData({
        ...formData,
        title: formData.title || file.name.replace('.pdf', ''),
        content: fullText.trim(),
      });
    } catch (error) {
      console.error('Error parsing PDF:', error);
      alert('Failed to extract text from PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingArticle) {
        await updateKnowledgeBase(editingArticle.id, formData);
      } else {
        await createKnowledgeBase(formData);
      }
      await loadArticles();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await deleteKnowledgeBase(articleId);
      await loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels = {
      nutrition_guideline: 'Nutrition Guideline',
      meal_plan: 'Meal Plan',
      fitness_protocol: 'Fitness Protocol',
    };
    return labels[type];
  };

  const getDocumentTypeColor = (type: DocumentType) => {
    const colors = {
      nutrition_guideline: 'bg-blue-100 text-blue-700',
      meal_plan: 'bg-green-100 text-green-700',
      fitness_protocol: 'bg-orange-100 text-orange-700',
    };
    return colors[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading knowledge base...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Article</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | DocumentType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="nutrition_guideline">Nutrition Guidelines</option>
            <option value="meal_plan">Meal Plans</option>
            <option value="fitness_protocol">Fitness Protocols</option>
          </select>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredArticles.length} of {articles.length} articles
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getDocumentTypeColor(
                    article.document_type
                  )}`}
                >
                  {getDocumentTypeLabel(article.document_type)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(article)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDialog({ isOpen: true, articleId: article.id })}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{article.content}</p>
              <div className="text-xs text-gray-500">
                {format(new Date(article.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <BookOpen className="w-12 h-12 mb-3 text-gray-300" />
            <p>No articles found</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingArticle ? 'Edit Article' : 'Add New Article'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload PDF</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Automatically extract text from document</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value as DocumentType })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="nutrition_guideline">Nutrition Guideline</option>
                  <option value="meal_plan">Meal Plan</option>
                  <option value="fitness_protocol">Fitness Protocol</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Enter article content"
                  rows={12}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                >
                  {editingArticle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, articleId: null })}
        onConfirm={() => {
          if (confirmDialog.articleId) {
            handleDeleteArticle(confirmDialog.articleId);
          }
        }}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
