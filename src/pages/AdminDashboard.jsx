import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import Button from '../components/ui/Button';
import { Trash2, Edit, Plus, X } from 'lucide-react';

export default function AdminDashboard() {
    const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'beef',
        image: ''
    });

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                title: product.title,
                description: product.description,
                price: product.price,
                category: product.category,
                image: product.image
            });
        } else {
            setEditingProduct(null);
            setFormData({
                title: '',
                description: '',
                price: '',
                category: 'beef',
                image: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const productData = {
            ...formData,
            price: parseFloat(formData.price)
        };

        if (editingProduct) {
            await updateProduct(editingProduct.id, productData);
        } else {
            await addProduct(productData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            await deleteProduct(id);
        }
    };

    return (
        <div className="px-4 py-8 sm:px-0">
            <div className="mb-6 flex justify-end">
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Produto
                </Button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {products.map((product) => (
                        <li key={product.id}>
                            <div className="flex items-center px-4 py-4 sm:px-6">
                                <div className="flex-shrink-0 h-12 w-12 mr-4">
                                    <img className="h-12 w-12 rounded-full object-cover" src={product.image} alt="" />
                                </div>
                                <div className="min-w-0 flex-1 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-primary-600 truncate">{product.title}</h3>
                                        <p className="mt-1 flex items-center text-sm text-gray-500">
                                            R$ {product.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(product)}>
                                            <Edit className="h-4 w-4 text-gray-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Título</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                <textarea className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Preço</label>
                                <input type="number" step="0.01" required className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                                <select className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="beef">Bovinos</option>
                                    <option value="pork">Suínos</option>
                                    <option value="poultry">Aves</option>
                                    <option value="exotic">Exóticos</option>
                                    <option value="kits">Kits</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">URL da Imagem</label>
                                <input type="text" className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">{editingProduct ? 'Salvar Alterações' : 'Criar Produto'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
