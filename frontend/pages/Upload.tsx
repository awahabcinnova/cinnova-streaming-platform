import React, { useState } from 'react';
import { Upload as UploadIcon, X, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { videoAPI } from '../api';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto-set title from filename initially
      setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', file); // must match backend param name
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (thumbnail) formData.append('thumbnail', thumbnail); // send thumbnail if present
      if (tags.length > 0) formData.append('tags', tags.join(','));
      // duration can be added if available

      // Call the API to upload the video
      const response = await videoAPI.createVideo(formData);

      // Update progress to 100% when done
      setUploadProgress(100);

      // Redirect after a short delay
      setTimeout(() => {
        setIsUploading(false);
        navigate('/'); // Redirect to home after success
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Upload Video</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative h-80">
            <input
              type="file"
              accept="video/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <UploadIcon size={40} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drag and drop video files to upload</h3>
            <p className="text-gray-500 mb-6">Your videos will be private until you publish them.</p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 pointer-events-none">
              Select Files
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-8">
            {/* Header / File Info */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  <UploadIcon size={24} />
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-blue-900 truncate max-w-[200px] md:max-w-md">{file.name}</p>
                  <p className="text-sm text-blue-700">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button type="button" onClick={() => setFile(null)} className="p-2 hover:bg-blue-200 rounded-full text-blue-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">Details</h3>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Title (required)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Add a title that describes your video"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-shadow"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell viewers about your video"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Thumbnail</h3>
                  </div>
                  <p className="text-sm text-gray-500 -mt-3">Select or upload a picture that shows what's in your video. A good thumbnail stands out and draws viewers' attention.</p>

                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {/* Upload Button */}
                    <div className="relative group flex-shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className={`w-44 h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all ${thumbnailPreview ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' : 'border-gray-300 bg-gray-50 group-hover:bg-gray-100 group-hover:border-gray-400'}`}>
                        {thumbnailPreview ? (
                          <div className="relative w-full h-full">
                            <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">Change</div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon size={24} className="text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 font-medium">Upload file</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[48px]">
                    {tags.length === 0 && <span className="text-sm text-gray-400 p-1">No tags added yet</span>}
                    {tags.map((tag) => (
                      <span key={tag} className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1 rounded-full hover:bg-gray-100 p-0.5">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter a tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !tags.includes(val)) {
                          setTags([...tags, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Video Preview</h3>
                    <div className="bg-black aspect-video rounded-lg w-full mb-3 overflow-hidden relative">
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Video Player</div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1 rounded">00:00</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Video Link</p>
                      <p className="text-sm text-gray-500 truncate">Will be available after upload</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white p-4 -mx-4 md:mx-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none z-10">
              <button
                type="button"
                onClick={() => setFile(null)}
                className="px-6 py-2.5 rounded-full font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-8 py-2.5 rounded-full font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-95"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Uploading {uploadProgress}%
                  </>
                ) : (
                  'Upload Video'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Upload;