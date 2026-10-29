import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
export const MediaViewerModal = ({ mediaId, mediaType, originalFilename, onClose, }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let active = true;
        let url = null;
        async function fetchDecryptedMedia() {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                const response = await fetch(api.media.getStreamUrl(mediaId), {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Failed to decrypt media: ${response.statusText}`);
                }
                const blob = await response.blob();
                if (active) {
                    url = URL.createObjectURL(blob);
                    setBlobUrl(url);
                }
            }
            catch (err) {
                if (active) {
                    setError(err.message || 'Could not load media stream.');
                }
            }
            finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        fetchDecryptedMedia();
        return () => {
            active = false;
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [mediaId]);
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#CBC3E3] flex items-center justify-between bg-[#F8F6FC]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#9F2B68]"/>
            <div>
              <h3 className="text-sm font-semibold text-[#301934] font-cinema">
                {originalFilename || 'Encrypted Media Asset'}
              </h3>
              <p className="text-[11px] text-[#9F2B68] flex items-center gap-1 font-mono font-medium">
                <Lock className="w-3 h-3"/>
                Decrypted on-the-fly via AES-256-GCM
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#483248] hover:text-[#9F2B68] hover:bg-[#E6E6FA] transition-colors cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Media Container */}
        <div className="p-6 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-y-auto bg-[#FAFAFE]">
          {loading && (<div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-[#9F2B68]/30 border-t-[#9F2B68] rounded-full animate-spin mx-auto"/>
              <p className="mt-3 text-xs text-[#AA98A9]">Decrypting authenticated stream...</p>
            </div>)}

          {error && (<div className="text-center py-8 text-[#800020] max-w-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#800020]"/>
              <p className="text-sm font-medium">{error}</p>
            </div>)}

          {!loading && !error && blobUrl && (<div className="w-full flex justify-center">
              {mediaType === 'IMAGE' ? (<img src={blobUrl} alt="Decrypted proposal asset" className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md border border-[#CBC3E3]"/>) : (<video src={blobUrl} controls autoPlay className="max-h-[60vh] max-w-full rounded-xl bg-black shadow-md"/>)}
            </div>)}
        </div>
      </div>
    </div>);
};
