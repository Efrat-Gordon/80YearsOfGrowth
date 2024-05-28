import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchFromGoogleDrive = () => {
      const fileId = '1vcNhKUCwsja6Obs6l6G6BNmC_WsXXRmf';
      const fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return fetch(fetchUrl).then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      });
    };

    const fetchFromLocal = () => {
      const fetchUrl = '/videos.csv';
      return fetch(fetchUrl).then(response => response.text());
    };

    const fetchData = async () => {
      try {
        const csvData = await fetchFromGoogleDrive();
        parseCsvData(csvData);
      } catch (error) {
        console.error('Error fetching from Google Drive:', error);
        try {
          const localCsvData = await fetchFromLocal();
          parseCsvData(localCsvData);
        } catch (localError) {
          console.error('Error fetching from local file:', localError);
        }
      }
    };

    const parseCsvData = (csvData) => {
      const parsedData = Papa.parse(csvData, { header: true }).data;
      const videosMap = new Map();

      parsedData.forEach(row => {
        const videoId = row.id;
        if (!videosMap.has(videoId)) {
          videosMap.set(videoId, {
            id: videoId,
            url: row.url,
            title: row.title,
            timestamps: [],
          });
        }
        videosMap.get(videoId).timestamps.push({ timestamp: row.timestamp, label: row.label });
      });

      setVideos(Array.from(videosMap.values()));
    };

    fetchData();
  }, []);

  const convertTimestamp = (timestamp) => {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const generateEmbedUrl = (url, timestamp) => {
    const videoId = new URL(url).searchParams.get('v');
    const startTime = convertTimestamp(timestamp);
    return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
  };

  const handleTimestampClick = (video, timestamp) => {
    setSelectedVideo({
      ...video,
      currentTimestamp: timestamp,
    });
  };

  return (
    <div className="App container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">80 Years of Growth</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <div className="grid grid-cols-1 gap-6">
            {videos.map(video => (
              <div key={video.id} className="video bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
                <h2 className="text-2xl font-semibold mb-2">{video.title}</h2>
                <ul className="list-disc list-inside space-y-2">
                  {video.timestamps.map((ts, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleTimestampClick(video, ts.timestamp)}
                        className="text-blue-500 hover:underline"
                      >
                        {ts.label} ({ts.timestamp})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-2/3">
          {selectedVideo && (
            <div className="selected-video bg-gray-100 p-6 rounded-lg shadow-lg">
              <h2 className="text-3xl font-semibold mb-4">{selectedVideo.title}</h2>
              <iframe
                width="100%"
                height="450"
                src={generateEmbedUrl(selectedVideo.url, selectedVideo.currentTimestamp)}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
