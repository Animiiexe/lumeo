"use client"

import { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { Sun, Moon, Box } from "lucide-react"
import YouTube from "react-youtube"
import LightRays from "./components/LightRays"

const SERVER_URL = import.meta.env.VITE_SERVER_PORT;
function WatchParty() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [nickname, setNickname] = useState("")
  const [room, setRoom] = useState("")
  const [joinedRoom, setJoinedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [videoId, setVideoId] = useState("")
  const [videoLink, setVideoLink] = useState("")

  useEffect(() => {
    if (!socket) return

    // when someone changes video
    socket.on("change-video", (newVideoId) => {
      setVideoId(newVideoId)
    })

    return () => {
      socket.off("change-video")
    }
  }, [socket])

  const handleChangeVideo = () => {
    if (!joinedRoom) {
      alert("Join a room first!")
      return
    }

    let id = ""

    // If user pasted a plain video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoLink.trim())) {
      id = videoLink.trim()
    } else {
      try {
        const url = new URL(videoLink)
        if (url.hostname.includes("youtu.be")) {
          id = url.pathname.slice(1)
        } else {
          id = url.searchParams.get("v")
        }
      } catch (e) {
        alert("Invalid YouTube link or video ID!")
        return
      }
    }

    if (id) {
      socket.emit("change-video", { room: joinedRoom, videoId: id })
      setVideoLink("")
    } else {
      alert("Invalid YouTube link!")
    }
  }

  const messagesEndRef = useRef(null)

  useEffect(() => {
    const sm = io(SERVER_URL, { transports: ["websocket"] })
    setSocket(sm)

    sm.on("connect", () => {
      setConnected(true)
    })

    sm.on("disconnect", () => {
      setConnected(false)
    })

    sm.on("user-joined", (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    sm.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg])
    })
    sm.on("video action", (action) => {
      const iframe = document.querySelector("iframe")
      if (!iframe) return
      const player = iframe.contentWindow

      if (action === "play") {
        player.postMessage('{"event":"command","func":"playVideo","args":""}', "*")
      } else if (action === "pause") {
        player.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*")
      }
    })

    return () => {
      sm.disconnect()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleJoinRoom = () => {
    if (socket && nickname.trim() && room.trim()) {
      socket.emit("set-nickname", nickname)
      socket.emit("join-room", room)
      setJoinedRoom(room)
      setMessages([]) // clear old messages
    }
  }

  const sendMessage = () => {
    if (!nickname.trim() || !joinedRoom) {
      alert("Please join a room first!")
      return
    }

    if (socket && chatInput.trim()) {
      socket.emit("chat-message", { room: joinedRoom, message: chatInput })
      setChatInput("")
    }
  }

  return (
    <div
      className={`min-h-screen py-8 px-4 transition-colors duration-300 relative ${isDarkMode ? "bg-black" : "bg-slate-50"}`}
    >
      {/* Fixed background with proper z-index */}

      {isDarkMode ? <div className="fixed w-full h-full inset-0 z-10">
        <LightRays
          raysOrigin="top-center"
          raysColor="#7B1FA2"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="w-full h-full"
        />
      </div> : <div></div>}


      {/* Main content with higher z-index */}
      <div className="max-w-4xl pt-10 mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-6xl font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              lumeo
            </h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 mt-2 rounded-lg transition-colors duration-200 ${isDarkMode
                ? "bg-gray-800 hover:bg-gray-700 text-white"
                : "bg-white hover:bg-gray-50 text-gray-600 border border-slate-400"
                }`}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun /> : <Moon />}
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className={`text-sm font-semibold tracking-wide ${isDarkMode ? "text-gray-300" : "text-slate-700"}`}>
              Connection Status:
            </span>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${connected
                ? isDarkMode
                  ? "bg-gradient-to-r from-green-900/70 to-emerald-900/50 text-emerald-200 shadow-lg shadow-emerald-900/30 border border-emerald-700/50"
                  : "bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 shadow-md shadow-emerald-100/80 border border-emerald-200"
                : isDarkMode
                  ? "bg-gradient-to-r from-rose-900/70 to-red-900/50 text-rose-200 shadow-lg shadow-rose-900/30 border border-rose-700/50"
                  : "bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 shadow-md shadow-rose-100/80 border border-rose-200"
                }`}
            >
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                />
                {connected && (
                  <div
                    className={`absolute inset-0 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"
                      } animate-ping`}
                  />
                )}
              </div>
              <span className="font-semibold tracking-wide">
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Join Room Form */}
        <div
          className={`rounded-xl shadow-sm border p-8 mb-8 transition-colors duration-300 ${isDarkMode ? " border-gray-700" : "bg-white/90 border-slate-400"
            }`}
        >
          <h2 className={`text-2xl font-semibold mb-6 text-center ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Join a Room
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <input
              type="text"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={`px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all duration-200 w-full sm:w-auto ${isDarkMode
                ? " border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-slate-300 text-slate-900 placeholder-gray-500"
                }`}
            />
            <input
              type="text"
              placeholder="Room name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className={`px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all duration-200 w-full sm:w-auto ${isDarkMode
                ? " border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-slate-300 text-slate-900 placeholder-gray-500"
                }`}
            />
            <button
              onClick={handleJoinRoom}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              Join
            </button>
          </div>
        </div>
      </div>
      <div className="z-10 relative">

        {joinedRoom && (
          <div
            className={`p-6 min-h-screen ${isDarkMode ? " border-gray-700" : "bg-white/50 border-gray-600"
              }`}
          >

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              {/* Left side: Logo + Room name */}
              <div className="flex items-center gap-2 text-4xl font-extrabold">
                <Box className={`mt-3 ${isDarkMode ? "text-white" : "text-slate-900"}`} />
                <span className={`${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {room}
                </span>
              </div>

            </div>


            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Section */}
              <div className="lg:col-span-2">
                {/* Video Controls */}
                <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-lg">
                  <h3 className="text-lg font-medium mb-4 text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Video Controls
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Paste YouTube link or video ID..."
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      className="flex-1 px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    <button
                      onClick={handleChangeVideo}
                      className="px-6 py-3 font-medium rounded-lg transition-colors duration-200 text-white bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Change Video
                    </button>
                  </div>
                </div>

                {/* Video Player */}
                {videoId && (
                  <div className=" bg-gray-800 p-4 rounded-xl shadow-lg w-full">
                    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                      {/* 16:9 aspect ratio (9/16 = 0.5625 → 56.25%) */}
                      <div className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl">
                        <YouTube
                          key={videoId}
                          videoId={videoId}
                          className="w-full h-full"
                          opts={{
                            width: "100%",
                            height: "100%",
                            playerVars: {
                              rel: 0,
                              modestbranding: 1,
                            },
                          }}
                          onPlay={() => socket.emit("video action", { room, action: "play" })}
                          onPause={() => socket.emit("video action", { room, action: "pause" })}
                          onStateChange={(e) => {
                            if (e.data === 1) {
                              console.log("▶️ Video playing")
                            } else if (e.data === 2) {
                              console.log("⏸️ Video paused")
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Section */}
              <div className="bg-gray-800 p-4 rounded-xl shadow-lg h-full">
                <h3 className="text-lg font-medium mb-4 text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Chat
                </h3>

                {/* Messages Container */}
                <div className="border border-gray-700 rounded-lg mb-4 transition-colors duration-300 bg-gray-800">
                  <div className="h-96 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="text-gray-500 mt-2">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <div
                          key={i}
                          className="rounded-lg px-4 py-3 text-sm leading-relaxed transition-colors duration-300 bg-gray-700 text-gray-100 border-l-2 border-purple-500"
                        >
                          <div className="flex items-center mb-1">
                            <span className="text-xs text-gray-500 ml-2">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {m}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Chat Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #374151;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #6B7280;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #9CA3AF;
    }
  `}</style>
          </div>
        )}
      </div>
    </div >
  )
}

export default WatchParty