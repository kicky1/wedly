'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const challenges = [
  "Photo with the best man",
  "Photo with the cake",
  "Photo of the first dance",
  "Photo of the bride's bouquet",
  "Photo of the groom's boutonniere",
  "Photo of the wedding rings",
  "Photo of the wedding venue",
  "Photo of the bridesmaids",
  "Photo of the groomsmen",
  "Photo of the newlyweds"
]

interface Photo {
  id: string
  url: string
}

export default function Challenges() {
  const searchParams = useSearchParams()
  const username = searchParams.get('username')
  const [photos, setPhotos] = useState<Record<string, Photo>>({})
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (username) {
      const storedPhotos = localStorage.getItem(`photos_${username}`)
      if (storedPhotos) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setPhotos(JSON.parse(storedPhotos))
      }
    }
  }, [username])

  const savePhotos = (newPhotos: Record<string, Photo>) => {
    setPhotos(newPhotos)
    localStorage.setItem(`photos_${username}`, JSON.stringify(newPhotos))
  }

  const startCamera = async (challenge: string) => {
    stopCamera()
    setCurrentChallenge(challenge)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing the camera", err)
      toast({
        title: "Error accessing the camera",
        description: "Unable to access camera. Please check your permissions or try uploading a photo instead.",
        variant: "destructive",
      })
      setCurrentChallenge(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && currentChallenge) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg')
        const newPhotos = { ...photos, [currentChallenge]: { id: Date.now().toString(), url: imageDataUrl } }
        savePhotos(newPhotos)
        stopCamera()
        toast({
          title: "Photo captured",
          description: "Your photo has been captured."
        })
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
    setCurrentChallenge(null)
  }

  const handlePhotoDelete = (challenge: string) => {
    const newPhotos = { ...photos }
    delete newPhotos[challenge]
    savePhotos(newPhotos)
    toast({
      title: "Photo deleted",
      description: "Your photo has been deleted."
    })
  }

  const handleFileUpload = (challenge: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        const newPhotos = { ...photos, [challenge]: { id: Date.now().toString(), url: e.target.result } }
        savePhotos(newPhotos)
        toast({
          title: "Photo uploaded",
          description: "Your photo has been uploaded."
        })
      }
    }
    reader.readAsDataURL(file)
  }

  if (!username) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-white">Wedding Photo Challenge for {username}</h1>
      {currentChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">{currentChallenge}</h2>
            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover mb-4" />
            <div className="flex justify-between">
              <Button onClick={capturePhoto}>Capture</Button>
              <Button variant="secondary" onClick={stopCamera}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {challenges.map((challenge) => (
          <Card key={challenge} className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">{challenge}</CardTitle>
            </CardHeader>
            <CardContent>
              {photos[challenge] ? (
                <img src={photos[challenge].url} alt={challenge} className="w-full h-32 sm:h-48 object-cover rounded" />
              ) : (
                <div className="w-full h-32 sm:h-48 bg-gray-200 flex items-center justify-center rounded">
                  No photo yet
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button onClick={() => startCamera(challenge)}>
                  <Camera className="mr-2 h-4 w-4" /> Take
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(challenge, file)
                  }}
                />
              </div>
              {photos[challenge] && (
                <Button variant="destructive" onClick={() => handlePhotoDelete(challenge)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} width={640} height={480} />
    </div>
  )
}