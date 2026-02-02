import React, { useEffect, useRef, useState } from 'react';
import { Radio, Mic, Video as VideoIcon, VideoOff, MicOff, MessageSquare, User as UserIcon } from 'lucide-react';

const Live: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);
    const [chatMessages, setChatMessages] = useState<{ user: string, text: string }[]>([]);
    const [streamKey] = useState("");
    const [streamTitle, setStreamTitle] = useState('');

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: cameraEnabled,
                    audio: micEnabled
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing media devices", err);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraEnabled, micEnabled]);

    const toggleStream = () => {
        setIsStreaming(!isStreaming);
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-6">
            {/* Stream Preview */}
            <div className="flex-1 flex flex-col">
                <div className="bg-black rounded-xl overflow-hidden relative flex-1 min-h-[400px]">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                        <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-white animate-pulse' : 'bg-red-800'}`}></div>
                        {isStreaming ? 'Live' : 'Offline'}
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full">
                        <button
                            onClick={() => setMicEnabled(!micEnabled)}
                            className={`p-3 rounded-full ${!micEnabled ? 'bg-red-500 text-white' : 'bg-gray-200 text-black hover:bg-white'}`}
                        >
                            {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        <button
                            onClick={() => setCameraEnabled(!cameraEnabled)}
                            className={`p-3 rounded-full ${!cameraEnabled ? 'bg-red-500 text-white' : 'bg-gray-200 text-black hover:bg-white'}`}
                        >
                            {cameraEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                        </button>
                        <button
                            onClick={toggleStream}
                            className={`px-6 py-2 rounded-full font-bold uppercase tracking-wide text-sm transition-all ${isStreaming ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {isStreaming ? 'End Stream' : 'Go Live'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4">Stream Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stream Title</label>
                            <input
                                type="text"
                                value={streamTitle}
                                onChange={(e) => setStreamTitle(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select className="w-full px-4 py-2 border rounded-lg">
                                <option>Gaming</option>
                                <option>Talk Show</option>
                                <option>Technology</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stream Key (Keep Private)</label>
                            <div className="flex gap-2">
                                <input type="password" value={streamKey} readOnly className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono text-sm" />
                                <button
                                    disabled={!streamKey}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Paste this into OBS or your streaming software.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Chat */}
            <div className="w-full lg:w-96 bg-white border border-gray-200 rounded-xl flex flex-col h-[500px] lg:h-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold">Live Chat</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <UserIcon size={14} />
                        <span>0</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">Chat is quiet...</p>
                        </div>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div key={idx} className="text-sm">
                                <span className="font-semibold text-gray-600 mr-2">{msg.user}</span>
                                <span className="text-gray-900">{msg.text}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-200">
                    <input
                        type="text"
                        placeholder="Say something..."
                        className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default Live;