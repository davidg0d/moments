import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product | null;
  isDeleting: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  product,
  isDeleting,
}: DeleteConfirmationModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="font-serif font-bold text-lg text-red-500">
              Confirmar Exclusão
            </h3>
          </div>
          <p className="text-gray-800 mb-4">
            Tem certeza que deseja excluir o produto{" "}
            <span className="font-medium">{product.name}</span>?
          </p>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
