import { Product } from "@shared/schema";
import { formatCurrency, createWhatsAppLink, truncateText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";
import { Pencil, Trash2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isAdminMode: boolean;
  whatsappNumber: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProductCard({
  product,
  isAdminMode,
  whatsappNumber,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const handleWhatsAppClick = () => {
    const message = `Olá! Tenho interesse no produto: ${product.name}`;
    window.open(createWhatsAppLink(whatsappNumber, message), "_blank");
  };

  return (
    <div className="product-card bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        <div className="w-full h-64 bg-gray-200">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
        {isAdminMode && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              onClick={onEdit}
              size="icon"
              variant="secondary"
              className="rounded-full bg-white text-[#25D366] shadow-md h-8 w-8" // Changed to green
            >
              <Pencil size={14} />
            </Button>
            <Button
              onClick={onDelete}
              size="icon"
              variant="secondary"
              className="rounded-full bg-white text-[#25D366] shadow-md h-8 w-8" // Changed to green
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif font-bold text-lg text-[#6B4E71] mb-1">
          {product.name}
        </h3>
        <p className="text-[#25D366] font-semibold mb-2"> {/* Changed to green */}
          {formatCurrency(product.price)}
        </p>
        <p className="text-gray-800 text-sm mb-3">
          {truncateText(product.description || "", 100)}
        </p>
        <Button
          onClick={handleWhatsAppClick}
          className="w-full py-2 bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2"
        >
          <FaWhatsapp className="text-lg" />
          Comprar pelo WhatsApp
        </Button>
      </div>
    </div>
  );
}