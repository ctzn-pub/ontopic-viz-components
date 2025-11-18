"use client"

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import StateMap from '@/components/geo/State'
import { Earth, Table as TableIcon, ChartBarDecreasing } from 'lucide-react'
interface StateData {
  state_name: string
  overall: number | null
}

interface Data {
  state_data: {
    [key: string]: StateData
  }
  question: string
  response: string
}

interface SortedDataItem {
  code: string
  state: string
  overall: number
}


export default function AllStateViz({ data }: any) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const sortedData = useMemo(() => {
    return Object.entries(data.state_data)
      .filter((entry): entry is [string, StateData & { overall: number }] => (entry[1] as any).overall !== null)
      .map(([code, data]): SortedDataItem => ({
        code,
        state: data.state_name,
        overall: data.overall
      }))
      .sort((a, b) => sortOrder === 'desc' ? b.overall - a.overall : a.overall - b.overall)
      .filter(item =>
        item.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
  }, [sortOrder, searchTerm])

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }


  const formattedData = Object.keys(data.state_data).map((key) => ({
    state: data.state_data[key].state_name,
    value: data.state_data[key].overall
  }));



  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardContent>
          <Tabs defaultValue="map">
            <TabsContent value="map">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{data.clean_title}</h2>
                  <span className="text-md text-gray-500">({data.year})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-md text-gray-500">{data.question}</span>
                </div>
                <StateMap
                  data={formattedData}
                  labels={{
                    title: data.question,
                    valueSuffix: "%",
                  }}
                  width={800}
                  height={400}
                />

                <div className="flex items-center gap-2">
                  <span className="text-md text-gray-500 mt-8">Source: CDC Behavioral Risk Factor Surveillance System</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="chart">

              <div className={`p-4 h-[400px] ${isExpanded ? 'h-auto' : 'overflow-hidden'}`}>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{data.clean_title}</h2>
                  <span className="text-md text-gray-500">({data.year})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-md text-gray-500">{data.question}</span>
                </div>
                <ResponsiveContainer width="100%" height={isExpanded ? 800 : 400}>
                  <BarChart data={sortedData} layout="vertical" margin={{ right: 20, top: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      label={{ value: `Response: ${data.response} (%)`, position: 'bottom', offset: 0 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis
                      dataKey="state"
                      type="category"
                      width={180}
                      interval={isExpanded ? 0 : 5}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, `Response: ${data.response}`]}
                      labelFormatter={(label: string) => `State: ${label}`}
                    />
                    <Bar dataKey="overall" fill="#4A4A4A" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-2">
                  <span className="text-md text-gray-500 mt-8">Source: CDC Behavioral Risk Factor Surveillance System</span>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline">
                  {isExpanded ? (
                    <>
                      See less <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Expand <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="table">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{data.clean_title}</h2>
                  <span className="text-md text-gray-500">({data.year})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-md text-gray-500">{data.question}</span>
                </div>
              </div>

              <div className={`${isExpanded ? 'h-auto' : 'h-[400px] overflow-hidden'}`}>
                <div className="flex justify-between items-center mb-4">
                  <Input
                    placeholder="Search states..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={toggleSort} variant="outline">
                    Sort {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State Code</TableHead>
                      <TableHead>State Name</TableHead>
                      <TableHead>Overall (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.state}</TableCell>
                        <TableCell>{item.overall.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center gap-2">
                  <span className="text-md text-gray-500 mt-8">Source: CDC Behavioral Risk Factor Surveillance System</span>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline">
                  {isExpanded ? (
                    <>
                      See less <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Expand <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsList >
              <TabsTrigger value="map"><Earth className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="chart"><ChartBarDecreasing className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="table"><TableIcon className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
    </div >
  )
}