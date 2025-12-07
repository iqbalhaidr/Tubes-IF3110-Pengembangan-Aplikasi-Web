import React from 'react';

const ItemPreviewCard = ({ product }) => {
    if (!product) {
        return <div className="text-sm italic text-gray-500">[Item not available]</div>;
    }

    return (
        <a href={`/product/${product.product_id}`} target="_blank" rel="noopener noreferrer" className="block w-56 no-underline">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-md">
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                    {product.main_image_path ? (
                        <img src={product.main_image_path} alt={product.product_name} className="w-full h-full object-cover" />
                    ) : (
                        <span>No Image</span>
                    )}
                </div>
                <div className="p-3">
                    <p className="font-semibold truncate text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-primary-green font-bold">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                </div>
            </div>
        </a>
    );
};

export default ItemPreviewCard;