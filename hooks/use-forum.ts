import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
      
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (error) throw error

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
      
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          category:forum_categories(*)
        `)
        .eq('is_approved', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query

      if (error) throw error

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
      
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_approved', true)
        .is('parent_id', null) // Solo comentarios principales
        .order('created_at', { ascending: true })

      if (error) throw error

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
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          title,
          content,
          author_id: user.id,
          category_id: categoryId
        })
        .select(`
          *,
          category:forum_categories(*)
        `)
        .single()

      if (error) throw error

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
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content,
          parent_id: parentId
        })
        .select('*')
        .single()

      if (error) throw error

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data: existingLike, error: fetchError } = await supabase
        .from('forum_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq(postId ? 'post_id' : 'comment_id', postId || commentId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingLike) {
        // Quitar like
        const { error } = await supabase
          .from('forum_likes')
          .delete()
          .eq('id', existingLike.id)

        if (error) throw error
      } else {
        // Dar like
        const { error } = await supabase
          .from('forum_likes')
          .insert({
            user_id: user.id,
            post_id: postId,
            comment_id: commentId
          })

        if (error) throw error
      }

      // Recargar posts o comentarios
      if (postId) {
        loadPosts()
      } else if (commentId) {
        loadComments(postId!)
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
    postId?: string, 
    commentId?: string, 
    reason: string, 
    description?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { error } = await supabase
        .from('forum_reports')
        .insert({
          reporter_id: user.id,
          post_id: postId,
          comment_id: commentId,
          reason,
          description
        })

      if (error) throw error

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