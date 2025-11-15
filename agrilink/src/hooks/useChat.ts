import { useState, useCallback, useEffect } from 'react'

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  timestamp: string
  type: 'text' | 'offer' | 'image'
  isRead: boolean
  offerDetails?: {
    amount: number
    quantity: number
    validUntil: string
    status: 'pending' | 'accepted' | 'rejected' | 'expired'
  }
}

interface Conversation {
  id: string
  buyerId: string
  sellerId: string
  productId: string
  productName: string
  productImage?: string
  buyerName: string
  buyerType: string
  buyerLocation: string
  buyerAccountType: string
  buyerVerified: boolean
  buyerPhoneVerified: boolean
  buyerVerificationStatus: string
  buyerVerificationSubmitted: boolean
  sellerName: string
  sellerType: string
  sellerLocation: string
  sellerAccountType: string
  sellerVerified: boolean
  sellerPhoneVerified: boolean
  sellerVerificationStatus: string
  sellerVerificationSubmitted: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  createdAt: string
}

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
      console.log('✅ Conversations loaded:', data.conversations?.length || 0)
      console.log('📊 Unread counts:', data.conversations?.map((c: any) => ({ id: c.id, unreadCount: c.unreadCount })) || [])
      
    } catch (err) {
      console.error('❌ Failed to load conversations:', err)
      setError('Failed to load conversations')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    console.log('🔄 loadMessages called for conversation:', conversationId);
    console.log('🔄 Current messages state before API call:', messages[conversationId]?.length || 0);
    
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load messages')
      }

      const data = await response.json()
      console.log('🔄 Raw API response:', data);
      
      const formattedMessages = data.messages?.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type || 'text',
        isRead: msg.isRead || false,
        offerDetails: msg.offerDetails
      })) || []

      console.log('✅ Messages loaded:', formattedMessages.length)
      console.log('🔄 Formatted messages:', formattedMessages.map(m => ({ id: m.id, content: m.content.substring(0, 30) })));

      setMessages(prev => {
        const newState = {
          ...prev,
          [conversationId]: formattedMessages
        };
        console.log('🔄 Updated messages state:', {
          conversationId,
          newMessagesCount: formattedMessages.length,
          allConversations: Object.keys(newState)
        });
        return newState;
      })
      
    } catch (err) {
      console.error('❌ Failed to load messages:', err)
      setMessages(prev => ({ ...prev, [conversationId]: [] }))
    }
  }, [])

  // Polling mechanism for real-time updates
  const startPolling = useCallback((conversationId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const formattedMessages = data.messages?.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            content: msg.content,
            timestamp: msg.timestamp,
            type: msg.type || 'text',
            isRead: msg.isRead || false,
            offerDetails: msg.offerDetails
          })) || []

          setMessages(prev => {
            const currentMessages = prev[conversationId] || []
            if (currentMessages.length !== formattedMessages.length) {
              console.log('🔄 New messages detected, updating...')
              return {
                ...prev,
                [conversationId]: formattedMessages
              }
            }
            return prev
          })
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    return pollInterval
  }, [])

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    senderId: string,
    type: 'text' | 'offer' | 'image' = 'text',
    offerDetails?: any
  ) => {
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          conversationId,
          content,
          senderId,
          type,
          offerDetails
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      const newMessage = data.message

      // Update local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage]
      }))

      console.log('✅ Message sent successfully')
      return newMessage
      
    } catch (err) {
      console.error('❌ Failed to send message:', err)
      throw err
    }
  }, [])

  const startConversation = useCallback(async (
    buyerId: string,
    sellerId: string,
    productId: string
  ) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          buyerId,
          sellerId,
          productId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start conversation')
      }

      const data = await response.json()
      const newConversation = data.conversation

      setConversations(prev => [newConversation, ...prev])
      console.log('✅ New conversation created:', newConversation.id)
      
      return newConversation
      
    } catch (err) {
      console.error('❌ Failed to start conversation:', err)
      return null
    }
  }, [])

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      setMessages(prev => {
        const updated = { ...prev }
        delete updated[conversationId]
        return updated
      })

      console.log('✅ Conversation deleted successfully:', conversationId)
      
    } catch (err) {
      console.error('❌ Failed to delete conversation:', err)
      throw err
    }
  }, [])

  return {
    conversations,
    messages,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    startConversation,
    deleteConversation,
    startPolling
  }
}
