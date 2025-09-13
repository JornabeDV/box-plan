"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ForumCategory } from "@/hooks/use-forum"
import { Loader2, X } from "lucide-react"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  categories: ForumCategory[]
  onSubmit: (title: string, content: string, categoryId: string) => Promise<void>
  loading: boolean
}

export function CreatePostModal({ 
  isOpen, 
  onClose, 
  categories, 
  onSubmit, 
  loading 
}: CreatePostModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    const newErrors: { [key: string]: string } = {}
    
    if (!title.trim()) {
      newErrors.title = "El título es requerido"
    } else if (title.length < 5) {
      newErrors.title = "El título debe tener al menos 5 caracteres"
    } else if (title.length > 200) {
      newErrors.title = "El título no puede exceder 200 caracteres"
    }
    
    if (!content.trim()) {
      newErrors.content = "El contenido es requerido"
    } else if (content.length < 10) {
      newErrors.content = "El contenido debe tener al menos 10 caracteres"
    }
    
    if (!categoryId) {
      newErrors.category = "Debes seleccionar una categoría"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    
    try {
      await onSubmit(title.trim(), content.trim(), categoryId)
      handleClose()
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handleClose = () => {
    setTitle("")
    setContent("")
    setCategoryId("")
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Crear Nuevo Post
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Título del Post
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título descriptivo..."
              className={errors.title ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {title.length}/200 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Categoría
            </Label>
            <Select 
              value={categoryId} 
              onValueChange={setCategoryId}
              disabled={loading}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Contenido
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comparte tus pensamientos, preguntas o experiencias..."
              className={`min-h-[200px] ${errors.content ? "border-red-500" : ""}`}
              disabled={loading}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {content.length} caracteres
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || !categoryId}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}