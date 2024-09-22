'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Trash2, Upload, X } from 'lucide-react'
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          aspectRatio: 4/3,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        } 
      })
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
      const video = videoRef.current
      const canvas = canvasRef.current
      const aspectRatio = video.videoWidth / video.videoHeight
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageDataUrl = canvas.toDataURL('image/jpeg')
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
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-white">Wedding Photo Challenge for {username}</h1>
      {currentChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{currentChallenge}</h2>
              <Button variant="ghost" size="icon" onClick={stopCamera}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={capturePhoto}>Capture</Button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <Card key={challenge} className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm">{challenge}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                {photos[challenge] ? (
                  <Image 
                    src={photos[challenge].url} 
                    alt={challenge} 
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded">
                    No photo yet
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startCamera(challenge)}>
                  <Camera className="mr-2 h-4 w-4" /> Take
                </Button>
                <Button size="sm" onClick={() => fileInputRef.current?.click()}>
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
                <Button size="sm" variant="destructive" onClick={() => handlePhotoDelete(challenge)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}