import React, { useState, useEffect, useRef } from 'react';

const TTSComponent = ({ name, inventory, price }) => {
  console.log("TTSComponent", name, inventory, price);

  const [audioSrc, setAudioSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchAudio = async () => {
      setLoading(true);
      let sourceText = '';
      
      if (name && inventory) {
        sourceText = `${name} inventory is getting lower, its at ${inventory || 'threshold'}`;

      } else {
        setLoading(false);
        console.error('Error: Name is required');
        return;
      }

      try {
        const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
          method: 'POST',
          headers: {
            Authorization:
              "HAAdDttl-hYhfAlV2sjzG9z7HpLjmgyDJcZVvJwJOaw085g_dMqM1eSVwE8hfywB",
            Accept: " */*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pipelineTasks: [
              {
                taskType: 'tts',
                config: {
                  language: {
                    sourceLanguage: 'en' // replace with your target language
                  },
                  serviceId: '', // replace with your TTS service ID
                  gender: 'female',
                  samplingRate: 8000,
                },
              },
            ],
            inputData: {
              input: [
                {
                  source: sourceText,
                },
              ],
            },
          }),
        });

        const data = await response.json();
        const base64Audio = data.pipelineResponse[0].audio[0].audioContent;
        const audioSrc = `data:audio/wav;base64,${base64Audio}`;
        setAudioSrc(audioSrc);
      } catch (error) {
        console.error('Error fetching audio:', error);
      } finally {
        setLoading(false);
      }
    };

    if (name || inventory || price) {
      fetchAudio();
    }
  }, [name, inventory, price]);

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  }, [audioSrc]);

  return (
    <div>
      {audioSrc && <audio ref={audioRef} src={audioSrc} controls />}
    </div>
  );
};

export default TTSComponent;
