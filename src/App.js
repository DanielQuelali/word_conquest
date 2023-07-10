import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import hull from 'hull.js';
import vocabularyMapping from './vocabulary.js';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [markerData, setMarkerData] = useState({ x: [], y: [], mode: 'markers+text', type: 'scatter', text: [] });
  const [convexHull, setConvexHull] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [score, setScore] = useState(0);
  const [scoreDiff, setScoreDiff] = useState(0);
  const [error, setError] = useState(false);
  const [userWord, setUserWord] = useState('');

  const handleChange = (event) => {
    setUserWord(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateMap(userWord);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      updateMap(userWord);
      setUserWord('');
      event.preventDefault();
    }
  };

  const embedWord2D = (word) => {
    let cleanWord = word.toLowerCase().trim();
    let coords = vocabularyMapping[cleanWord];
    if (coords !== undefined) {
      let x = coords[0];
      let y = coords[1];
      let z = Math.sqrt(x * x + y * y);
      let diskX = x / (1 + z);
      let diskY = y / (1 + z);
      return [diskX, diskY];
    } else {
      return null;
    }
  };

  const calculateArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      let j = (i + 1) % points.length;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
    return Math.abs(area) / 2;
  };

  const updateMap = (newWord) => {
    let coords = embedWord2D(newWord);

    if (!coords) {
      setErrorMessage(`The word "${newWord}" was not found in the vocabulary. Please try another word.`);
      setError(true);
      return;
    } else {
      setError(false);
      setErrorMessage('');
    }

    // Update the Plotly chart with the new coordinates
    let newMarkerData = {
      ...markerData,
      x: [...markerData.x, coords[0]],
      y: [...markerData.y, coords[1]],
      text: [...markerData.text, newWord],
      textposition: 'top center',
      hoverinfo: 'text',
      marker: { color: '#1f77b4', size: 4 },
    };

    setMarkerData(newMarkerData);

    // Compute the convex hull
    let points = newMarkerData.x.map((x, i) => [x, newMarkerData.y[i]]);
    let hullPoints = hull(points, 10); // 10 is the concavity parameter
    setConvexHull({
      x: hullPoints.map((point) => point[0]),
      y: hullPoints.map((point) => point[1]),
      mode: 'lines',
      fill: 'toself',
      hoverinfo: 'skip',
      type: 'scatter',
    });

    // Calculate the area of the convex hull (i.e., the score)
    let hullArea = calculateArea(hullPoints);
    let newScore = Math.floor(hullArea * 10000);
    // Calculate the score difference
    let diff = newScore - score;
  
    // Update the score and scoreDiff states
    setScore(newScore);
    setScoreDiff(diff);
  };

  const RenderPlot = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
        <Plot
          data={convexHull !== null ? [convexHull, markerData] : [markerData]}
          layout={{
            margin: { l: 0, r: 0, b: 0, t: 0, pad: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)', // makes background transparent
            height: 350,
            showlegend: false,
            autosize: true,
            dragmode: 'pan',
            xaxis: {
              showgrid: true,
              zeroline: false,
              showticklabels: false,
              title: null,
              range: [-1.1, 1.1],
            },
            yaxis: {
              showgrid: true,
              zeroline: false,
              showticklabels: false,
              title: null,
              range: [-1.1, 1.1],
            },
            modebar: {
              orientation: 'v',
              bgcolor: 'rgba(0,0,0,0.1)',
              color: 'rgba(0,0,0,0.6)',
              remove: [
                'autoScale2d',
                'autoscale',
                'editInChartStudio',
                'editinchartstudio',
                'hoverCompareCartesian',
                'hovercompare',
                'lasso',
                'lasso2d',
                'orbitRotation',
                'orbitrotation',
                'select',
                'select2d',
                'sendDataToCloud',
                'senddatatocloud',
                'tableRotation',
                'tablerotation',
                'toImage',
                'toggleHover',
                'toggleSpikelines',
                'togglehover',
                'togglespikelines',
                'toimage',
                'zoom',
                'zoom2d',
                'zoom3d',
                'pan',
                'pan2d',
                'pan3d',
              ],
            },
          }}
          useResizeHandler={true}
          style={{width: '100%', height: '100%'}}
        />
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Typography component="h1" variant="h4" style={{ textAlign: 'center' }}>
          Word Conquest
        </Typography>
        <Typography variant="h6">Score: {score} (+{scoreDiff})</Typography>
        <RenderPlot />
        <form noValidate onSubmit={handleSubmit}>
          <TextField
            error={error}
            helperText={errorMessage}
            variant="outlined"
            margin="normal"
            fullWidth
            id="word"
            label="New Word"
            name="word"
            autoFocus
            value={userWord}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            autoComplete="off"
          />
        </form>
      </Container>
    </ThemeProvider>
  );
}

export default App;
