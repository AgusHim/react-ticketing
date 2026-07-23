"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MessageCircle, ExternalLink } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  media?: {
    type: "image" | "video"
    url: string
    caption?: string
  }
}

export default function ChatDialog() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I can share images and videos with you. Here's a beautiful landscape:",
      sender: "bot",
      timestamp: new Date(Date.now() - 120000),
      media: {
        type: "image",
        url: "/placeholder.svg?height=200&width=300",
        caption: "Beautiful mountain landscape",
      },
    },
    {
      id: "2",
      text: "That's amazing! Can you show me a video too?",
      sender: "user",
      timestamp: new Date(Date.now() - 90000),
    },
    {
      id: "3",
      text: "Of course! Here's a sample video for you:",
      sender: "bot",
      timestamp: new Date(Date.now() - 60000),
      media: {
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        caption: "Big Buck Bunny - Sample Video",
      },
    },
    {
      id: "4",
      text: "Thanks! The media sharing feature works great.",
      sender: "user",
      timestamp: new Date(),
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [open, setOpen] = useState(false)

  const openMediaInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const addMediaMessage = (type: "image" | "video") => {
    const mediaUrls = {
      image: [
        "/placeholder.svg?height=250&width=400",
        "/placeholder.svg?height=300&width=300",
        "/placeholder.svg?height=200&width=350",
      ],
      video: [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      ],
    }

    const randomUrl = mediaUrls[type][Math.floor(Math.random() * mediaUrls[type].length)]

    const botMessage: Message = {
      id: `${messages.length + 2}`,
      text: `Here's a ${type} for you:`,
      sender: "bot",
      timestamp: new Date(),
      media: {
        type,
        url: randomUrl,
        caption: `Sample ${type}`,
      },
    }
    setMessages((prev) => [...prev, botMessage])
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: `${messages.length + 1}`,
        text: newMessage,
        sender: "user",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      const messageText = newMessage.toLowerCase()
      setNewMessage("")

      // Simulate bot response with media detection
      setTimeout(() => {
        if (messageText.includes("image") || messageText.includes("picture") || messageText.includes("photo")) {
          addMediaMessage("image")
        } else if (messageText.includes("video") || messageText.includes("clip")) {
          addMediaMessage("video")
        } else {
          const botMessage: Message = {
            id: `${messages.length + 2}`,
            text: "Thanks for your message! Try asking for an 'image' or 'video' to see media sharing in action.",
            sender: "bot",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, botMessage])
        }
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="neo-dots flex min-h-screen items-center justify-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Open Chat
          </Button>
        </DialogTrigger>
        <DialogContent className="flex h-[600px] flex-col bg-white p-0 sm:max-w-[500px]">
          <DialogHeader className="border-b-2 border-neo-border bg-neo-purple px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat Support
            </DialogTitle>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "bot" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">AI</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[70%] space-y-2`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>

                    {/* Media Content */}
                    {message.media && (
                      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
                        {message.media.type === "image" ? (
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => openMediaInNewTab(message.media!.url)}
                          >
                            <img
                              src={message.media.url || "/placeholder.svg"}
                              alt={message.media.caption || "Shared image"}
                              className="w-full h-auto max-h-48 object-cover"
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-2">
                                <ExternalLink className="h-4 w-4 text-gray-700" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <video
                              src={message.media.url}
                              className="w-full h-auto max-h-48 object-cover"
                              controls
                              preload="metadata"
                              crossOrigin="anonymous"
                            >
                              Your browser does not support the video tag.
                            </video>
                            <button
                              onClick={() => openMediaInNewTab(message.media!.url)}
                              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1.5 transition-all duration-200"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {message.media.caption && (
                          <div className="px-3 py-2 text-xs text-gray-600 border-t">{message.media.caption}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-500 text-white text-xs">You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t-2 border-neo-border bg-neo-yellow px-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
