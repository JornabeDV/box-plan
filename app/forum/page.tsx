"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ForumCategories } from "@/components/forum/forum-categories"
import { ForumPosts } from "@/components/forum/forum-posts"
import { CreatePostModal } from "@/components/forum/create-post-modal"
import { useForum } from "@/hooks/use-forum"
import { Plus, Search, Filter } from "lucide-react"
import { toast } from "sonner"

export default function ForumPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState("recent")

  const {
    categories,
    posts,
    loading,
    error,
    loadPosts,
    createPost
  } = useForum()

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    loadPosts(categoryId)
  }

  const handleShowAll = () => {
    setSelectedCategory(undefined)
    loadPosts()
  }

  const handleCreatePost = async (title: string, content: string, categoryId: string) => {
    const { error } = await createPost(title, content, categoryId)
    if (error) {
      toast.error(error)
    } else {
      toast.success("Post creado exitosamente")
      // Recargar posts
      if (selectedCategory) {
        loadPosts(selectedCategory)
      } else {
        loadPosts()
      }
    }
  }

  const handlePostClick = (postId: string) => {
    // Navegar al post individual
    window.location.href = `/forum/post/${postId}`
  }

  const handleLike = async (postId: string) => {
    // Implementar lógica de like
    console.log("Like post:", postId)
  }

  const handleReport = (postId: string, reason: string) => {
    // Implementar lógica de reporte
    console.log("Report post:", postId, reason)
    toast.success("Post reportado")
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Foro de Socios
            </h1>
            <p className="text-muted-foreground">
              Conecta con otros atletas, comparte experiencias y aprende juntos
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Post
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <ForumCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              onShowAll={handleShowAll}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recent">Recientes</TabsTrigger>
                <TabsTrigger value="popular">Populares</TabsTrigger>
                <TabsTrigger value="pinned">Fijados</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recent" className="mt-6">
                <ForumPosts
                  posts={filteredPosts}
                  loading={loading}
                  onPostClick={handlePostClick}
                  onLike={handleLike}
                  onReport={handleReport}
                />
              </TabsContent>
              
              <TabsContent value="popular" className="mt-6">
                <ForumPosts
                  posts={filteredPosts.sort((a, b) => b.like_count - a.like_count)}
                  loading={loading}
                  onPostClick={handlePostClick}
                  onLike={handleLike}
                  onReport={handleReport}
                />
              </TabsContent>
              
              <TabsContent value="pinned" className="mt-6">
                <ForumPosts
                  posts={filteredPosts.filter(post => post.is_pinned)}
                  loading={loading}
                  onPostClick={handlePostClick}
                  onLike={handleLike}
                  onReport={handleReport}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          categories={categories}
          onSubmit={handleCreatePost}
          loading={loading}
        />
      </div>
    </div>
  )
}