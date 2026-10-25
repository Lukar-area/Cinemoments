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
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-cinema-850 border border-cinema-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-cinema-700 flex items-center justify-between bg-cinema-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400"/>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {originalFilename || 'Encrypted Media Asset'}
              </h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3"/>
                Decrypted on-the-fly via AES-256-GCM
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cinema-700 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Media Container */}
        <div className="p-6 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-y-auto bg-black/40">
          {loading && (<div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-cinema-gold/30 border-t-cinema-gold rounded-full animate-spin mx-auto"/>
              <p className="mt-3 text-xs text-slate-400">Decrypting authenticated stream...</p>
            </div>)}

          {error && (<div className="text-center py-8 text-red-400 max-w-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400"/>
              <p className="text-sm font-medium">{error}</p>
            </div>)}

          {!loading && !error && blobUrl && (<div className="w-full flex justify-center">
              {mediaType === 'IMAGE' ? (<img src={blobUrl} alt="Decrypted proposal asset" className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-lg"/>) : (<video src={blobUrl} controls autoPlay className="max-h-[60vh] max-w-full rounded-lg bg-black shadow-lg"/>)}
            </div>)}
        </div>
      </div>
    </div>);
};
