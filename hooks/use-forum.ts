'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface ForumCategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ForumPost {
  id: string
  title: string
  content: string
  author_id: string
  category_id: string
  is_pinned: boolean
  is_locked: boolean
  is_approved: boolean
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  category?: ForumCategory
  is_liked?: boolean
}

export interface ForumComment {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_id?: string
  like_count: number
  is_approved: boolean
  created_at: string
  updated_at: string
  is_liked?: boolean
  replies?: ForumComment[]
}

interface ForumState {
  categories: ForumCategory[]
  posts: ForumPost[]
  comments: ForumComment[]
  loading: boolean
  error: string | null
}

export function useForum() {
  const { data: session } = useSession()
  const [state, setState] = useState<ForumState>({
    categories: [],
    posts: [],
    comments: [],
    loading: false,
    error: null
  })

  // Cargar categorías
  const loadCategories = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/forum/categories')
      
      if (!response.ok) {
        throw new Error('Error al cargar categorías')
      }

      const data = await response.json()
      setState(prev => ({ ...prev, categories: data || [], loading: false }))
    } catch (error) {
      console.error('Error loading categories:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error al cargar categorías' 
      }))
    }
  }

  // Cargar posts
  const loadPosts = async (categoryId?: string, limit = 20, offset = 0) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })
      
      if (categoryId) {
        params.append('categoryId', categoryId)
      }

      const response = await fetch(`/api/forum/posts?${params}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar posts')
      }

      const data = await response.json()
      setState(prev => ({ ...prev, posts: data || [], loading: false }))
    } catch (error) {
      console.error('Error loading posts:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error al cargar posts' 
      }))
    }
  }

  // Cargar comentarios de un post
  const loadComments = async (postId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch(`/api/forum/comments?postId=${postId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar comentarios')
      }

      const data = await response.json()
      setState(prev => ({ ...prev, comments: data || [], loading: false }))
    } catch (error) {
      console.error('Error loading comments:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error al cargar comentarios' 
      }))
    }
  }

  // Crear post
  const createPost = async (title: string, content: string, categoryId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category_id: categoryId })
      })

      if (!response.ok) {
        throw new Error('Error al crear el post')
      }

      const data = await response.json()
      setState(prev => ({ 
        ...prev, 
        posts: [data, ...prev.posts], 
        loading: false 
      }))

      return { data, error: null }
    } catch (error) {
      console.error('Error creating post:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el post'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  // Crear comentario
  const createComment = async (postId: string, content: string, parentId?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/forum/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content, parent_id: parentId })
      })

      if (!response.ok) {
        throw new Error('Error al crear el comentario')
      }

      const data = await response.json()
      setState(prev => ({ 
        ...prev, 
        comments: [...prev.comments, data], 
        loading: false 
      }))

      return { data, error: null }
    } catch (error) {
      console.error('Error creating comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el comentario'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  // Dar like a post o comentario
  const toggleLike = async (postId?: string, commentId?: string) => {
    try {
      if (!session?.user?.id) {
        throw new Error('Usuario no autenticado')
      }

      const response = await fetch('/api/forum/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, comment_id: commentId })
      })

      if (!response.ok) {
        throw new Error('Error al dar like')
      }

      const result = await response.json()

      // Recargar posts o comentarios
      if (postId) {
        loadPosts()
      } else if (commentId && postId) {
        loadComments(postId)
      }

      return { error: null }
    } catch (error) {
      console.error('Error toggling like:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al dar like'
      return { error: errorMessage }
    }
  }

  // Reportar post o comentario
  const reportContent = async (
    reason: string,
    postId?: string, 
    commentId?: string, 
    description?: string
  ) => {
    try {
      if (!session?.user?.id) {
        throw new Error('Usuario no autenticado')
      }

      const response = await fetch('/api/forum/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, comment_id: commentId, reason, description })
      })

      if (!response.ok) {
        throw new Error('Error al reportar contenido')
      }

      return { error: null }
    } catch (error) {
      console.error('Error reporting content:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al reportar contenido'
      return { error: errorMessage }
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadCategories()
    loadPosts()
  }, [])

  return {
    ...state,
    loadCategories,
    loadPosts,
    loadComments,
    createPost,
    createComment,
    toggleLike,
    reportContent
  }
}