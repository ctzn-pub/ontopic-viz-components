"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const correlationMatrix = {
  ACCESS2: { ACCESS2: 1.0, ARTHRITIS: -0.01, BINGE: -0.44, BPHIGH: 0.43, CANCER: -0.66, DIABETES: 0.64, OBESITY: 0.37 },
  ARTHRITIS: {
    ACCESS2: -0.01,
    ARTHRITIS: 1.0,
    BINGE: -0.52,
    BPHIGH: 0.71,
    CANCER: 0.26,
    DIABETES: 0.57,
    OBESITY: 0.56,
  },
  BINGE: { ACCESS2: -0.44, ARTHRITIS: -0.52, BINGE: 1.0, BPHIGH: -0.58, CANCER: 0.29, DIABETES: -0.7, OBESITY: -0.32 },
  BPHIGH: { ACCESS2: 0.43, ARTHRITIS: 0.71, BINGE: -0.58, BPHIGH: 1.0, CANCER: -0.21, DIABETES: 0.87, OBESITY: 0.71 },
  CANCER: { ACCESS2: -0.66, ARTHRITIS: 0.26, BINGE: 0.29, BPHIGH: -0.21, CANCER: 1.0, DIABETES: -0.46, OBESITY: -0.12 },
  DIABETES: { ACCESS2: 0.64, ARTHRITIS: 0.57, BINGE: -0.7, BPHIGH: 0.87, CANCER: -0.46, DIABETES: 1.0, OBESITY: 0.7 },
  OBESITY: { ACCESS2: 0.37, ARTHRITIS: 0.56, BINGE: -0.32, BPHIGH: 0.71, CANCER: -0.12, DIABETES: 0.7, OBESITY: 1.0 },
}

function clusterVariables(matrix: typeof correlationMatrix): string[] {
  const variables = Object.keys(matrix)
  const clustered: string[] = []
  const remaining = [...variables]

  // Start with the variable that has the highest average correlation with others
  let maxAvgCorr = -1
  let startVar = remaining[0]

  for (const variable of remaining) {
    const avgCorr =
      remaining
        .filter((v) => v !== variable)
        .reduce(
          (sum, v) =>
            sum + Math.abs(matrix[variable as keyof typeof matrix][v as keyof (typeof matrix)[typeof variable]]),
          0,
        ) /
      (remaining.length - 1)

    if (avgCorr > maxAvgCorr) {
      maxAvgCorr = avgCorr
      startVar = variable
    }
  }

  clustered.push(startVar)
  remaining.splice(remaining.indexOf(startVar), 1)

  // Greedily add variables that are most correlated with already clustered variables
  while (remaining.length > 0) {
    let maxCorr = -1
    let nextVar = remaining[0]

    for (const variable of remaining) {
      const avgCorrWithClustered =
        clustered.reduce(
          (sum, clusteredVar) =>
            sum +
            Math.abs(matrix[variable as keyof typeof matrix][clusteredVar as keyof (typeof matrix)[typeof variable]]),
          0,
        ) / clustered.length

      if (avgCorrWithClustered > maxCorr) {
        maxCorr = avgCorrWithClustered
        nextVar = variable
      }
    }

    clustered.push(nextVar)
    remaining.splice(remaining.indexOf(nextVar), 1)
  }

  return clustered
}

const clusteredVariables = clusterVariables(correlationMatrix)

const heatmapData = []
for (let i = 0; i < clusteredVariables.length; i++) {
  for (let j = 0; j <= i; j++) {
    // Only lower triangle (j <= i)
    const yVar = clusteredVariables[i]
    const xVar = clusteredVariables[j]
    const value =
      correlationMatrix[yVar as keyof typeof correlationMatrix][xVar as keyof (typeof correlationMatrix)[typeof yVar]]

    heatmapData.push({
      x: j,
      y: i,
      xVar,
      yVar,
      value,
      color: getCorrelationColor(value),
    })
  }
}

function getCorrelationColor(value: number): string {
  // Enhanced color scale for better visibility
  if (value < 0) {
    const intensity = Math.abs(value)
    const red = Math.round(180 + (255 - 180) * intensity)
    const green = Math.round(200 * (1 - intensity * 0.8))
    const blue = Math.round(200 * (1 - intensity * 0.8))
    return `rgb(${red}, ${green}, ${blue})`
  } else {
    const intensity = value
    const red = Math.round(200 * (1 - intensity * 0.8))
    const green = Math.round(200 * (1 - intensity * 0.5))
    const blue = Math.round(180 + (255 - 180) * intensity)
    return `rgb(${red}, ${green}, ${blue})`
  }
}

export default function CorrelationHeatmap() {
  const cellSize = 80 // Increased cell size for better readability
  const maxWidth = clusteredVariables.length * cellSize
  const width = maxWidth + 120
  const height = clusteredVariables.length * cellSize + 100

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>County Health Correlations</CardTitle>
        <CardDescription>
          Clustered correlation matrix showing relationships between health conditions (lower triangular)
        </CardDescription>

        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm font-medium">Correlation coefficient</span>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
            <span className="text-xs mx-1">-1.0</span>
            <div className="w-12 h-4 bg-gradient-to-r from-red-500 via-gray-100 to-blue-500 rounded-sm"></div>
            <span className="text-xs mx-1">0.0</span>
            <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
            <span className="text-xs ml-1">1.0</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="border rounded">
            {clusteredVariables.map((variable, i) => (
              <text
                key={`y-${i}`}
                x={100}
                y={50 + i * cellSize + cellSize / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-sm font-semibold fill-gray-700"
              >
                {variable}
              </text>
            ))}

            {clusteredVariables.map((variable, j) => (
              <text
                key={`x-${j}`}
                x={110 + j * cellSize + cellSize / 2}
                y={35}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm font-semibold fill-gray-700"
                transform={`rotate(-45, ${110 + j * cellSize + cellSize / 2}, 35)`}
              >
                {variable}
              </text>
            ))}

            {heatmapData.map((cell, index) => (
              <g key={index}>
                <rect
                  x={110 + cell.x * cellSize}
                  y={50 + cell.y * cellSize}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  fill={cell.color}
                  stroke="#fff"
                  strokeWidth={2}
                  className="cursor-pointer hover:stroke-gray-400 hover:stroke-3"
                  rx={4}
                />
                <text
                  x={110 + cell.x * cellSize + cellSize / 2}
                  y={50 + cell.y * cellSize + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-gray-800 pointer-events-none"
                >
                  {cell.value.toFixed(2)}
                </text>
              </g>
            ))}

            {heatmapData.map((cell, index) => (
              <rect
                key={`overlay-${index}`}
                x={110 + cell.x * cellSize}
                y={50 + cell.y * cellSize}
                width={cellSize - 2}
                height={cellSize - 2}
                fill="transparent"
                className="cursor-pointer"
              >
                <title>{`${cell.yVar} ↔ ${cell.xVar}: ${cell.value.toFixed(3)}`}</title>
              </rect>
            ))}
          </svg>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-600">
          <p>
            <strong>Clustered correlation matrix:</strong> Variables are reordered to group similar patterns together,
            making it easier to identify clusters of related health conditions.
          </p>
          <p>
            <strong>Reading the matrix:</strong> Blue indicates positive correlations (conditions that tend to occur
            together), red indicates negative correlations (conditions that tend to be inversely related).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
