"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ForumPost } from "@/hooks/use-forum"
import { 
  MessageCircle, 
  Heart, 
  Eye, 
  Pin, 
  Lock,
  MoreVertical,
  Flag
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface ForumPostsProps {
  posts: ForumPost[]
  loading: boolean
  onPostClick: (postId: string) => void
  onLike: (postId: string) => void
  onReport: (postId: string, reason: string) => void
}

export function ForumPosts({ 
  posts, 
  loading, 
  onPostClick, 
  onLike, 
  onReport 
}: ForumPostsProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const handleLike = async (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
    onLike(postId)
  }

  const handleReport = (postId: string) => {
    onReport(postId, "Contenido inapropiado")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay posts aún
          </h3>
          <p className="text-muted-foreground">
            Sé el primero en crear un post en esta categoría
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card 
          key={post.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onPostClick(post.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    U
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-foreground">
                      Usuario
                    </h3>
                    {post.is_pinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                    {post.is_locked && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleReport(post.id)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground line-clamp-2">
                {post.title}
              </h2>
              <p className="text-muted-foreground line-clamp-3">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(post.id)
                    }}
                    className={`flex items-center space-x-1 ${
                      likedPosts.has(post.id) ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        likedPosts.has(post.id) ? "fill-current" : ""
                      }`} 
                    />
                    <span>{post.like_count}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 text-muted-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comment_count}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 text-muted-foreground"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{post.view_count}</span>
                  </Button>
                </div>
                
                {post.category && (
                  <Badge 
                    variant="secondary"
                    style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
                  >
                    {post.category.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}