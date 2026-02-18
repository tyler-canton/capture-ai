"use client";

import { useState, useEffect } from "react";
import { Subject } from "@/lib/types";

interface EmbeddedDocument {
  id: number;
  name: string;
  image_id: string;
  text: string;
  embedding: number[];
  similarity?: number;
}

const SEMANTIC_GROUPS: Record<string, string[]> = {
  charlie: ["chuck", "charles", "chas", "charley"],
  chuck: ["charlie", "charles", "chas", "charley"],
  charles: ["charlie", "chuck", "chas", "charley"],
  jack: ["john", "johnny", "jon", "jonathan", "javl"],
  john: ["jack", "johnny", "jon", "jonathan"],
  johnny: ["jack", "john", "jon", "jonathan"],
  jon: ["jack", "john", "johnny", "jonathan"],
  javl: ["jack", "john", "johnny"],
  will: ["william", "bill", "billy", "willy", "liam"],
  bill: ["william", "will", "billy", "willy", "liam"],
  william: ["will", "bill", "billy", "willy", "liam"],
  bob: ["robert", "rob", "bobby", "robbie"],
  robert: ["bob", "rob", "bobby", "robbie"],
  rob: ["bob", "robert", "bobby", "robbie"],
  dick: ["richard", "rick", "rich", "ricky"],
  richard: ["dick", "rick", "rich", "ricky"],
  rick: ["dick", "richard", "rich", "ricky"],
  liz: ["elizabeth", "beth", "lizzy", "eliza", "betty"],
  elizabeth: ["liz", "beth", "lizzy", "eliza", "betty"],
  beth: ["liz", "elizabeth", "lizzy", "eliza", "betty"],
  maggie: ["margaret", "meg", "peggy", "marge"],
  margaret: ["maggie", "meg", "peggy", "marge"],
  peggy: ["maggie", "margaret", "meg", "marge"],
};

function getSemanticText(text: string): string {
  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/);
  const expanded = words.map(word => {
    const relatives = SEMANTIC_GROUPS[word];
    if (relatives) {
      return [word, ...relatives.slice(0, 2)].join(" ");
    }
    return word;
  });
  return expanded.join(" ");
}

function generateEmbedding(text: string): number[] {
  const semanticText = getSemanticText(text);
  const dimensions = 16;
  return Array.from({ length: dimensions }, (_, i) => {
    let val = 0;
    for (let j = 0; j < semanticText.length; j++) {
      val += Math.sin(semanticText.charCodeAt(j) * (i + 1) * 0.1 + j * 0.05);
    }
    return (Math.tanh(val / semanticText.length) + 1) / 2;
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export default function RagPipeline() {
  const [documents, setDocuments] = useState<EmbeddedDocument[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);
  const [results, setResults] = useState<EmbeddedDocument[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [csvContent, setCsvContent] = useState<string>("");
  const [indexedCount, setIndexedCount] = useState(0);

  useEffect(() => {
    loadDefaultData();
  }, []);

  const loadDefaultData = async () => {
    try {
      const response = await fetch("/subject_images.csv");
      const text = await response.text();
      await indexCSVData(text, 50);
    } catch (error) {
      console.error("Failed to load default data:", error);
      const sampleDocs: EmbeddedDocument[] = [
        { id: 1, name: "Charlie Smith", image_id: "img_001.jpg", text: "Charlie Smith - img_001.jpg", embedding: generateEmbedding("Charlie Smith") },
        { id: 2, name: "Jack Johnson", image_id: "img_002.jpg", text: "Jack Johnson - img_002.jpg", embedding: generateEmbedding("Jack Johnson") },
        { id: 3, name: "Diana Williams", image_id: "img_003.jpg", text: "Diana Williams - img_003.jpg", embedding: generateEmbedding("Diana Williams") },
      ];
      setDocuments(sampleDocs);
      setIndexedCount(sampleDocs.length);
    }
  };

  const indexCSVData = async (content: string, limit?: number) => {
    setIsIndexing(true);
    setIndexingProgress(0);

    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());

    const dataLines = lines.slice(1);
    const totalToIndex = limit ? Math.min(limit, dataLines.length) : dataLines.length;

    const indexed: EmbeddedDocument[] = [];

    for (let i = 0; i < totalToIndex; i++) {
      const values = dataLines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      const subject: Subject = {
        id: parseInt(row.id) || i + 1,
        name: row.name || `Subject ${i + 1}`,
        image_id: row.image_id || `img_${i}.jpg`,
      };

      const searchableText = `${subject.name} - ${subject.image_id}`;

      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setIndexingProgress(Math.round((i / totalToIndex) * 100));
      }

      indexed.push({
        ...subject,
        text: searchableText,
        embedding: generateEmbedding(searchableText),
      });
    }

    setDocuments(indexed);
    setIndexedCount(indexed.length);
    setIsIndexing(false);
    setIndexingProgress(100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let content = event.target?.result as string;

      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      setCsvContent(content);

      const rowCount = content.trim().split("\n").length - 1;
      const indexLimit = Math.min(rowCount, 100);

      await indexCSVData(content, indexLimit);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const runRAGSearch = async () => {
    if (!query || documents.length === 0) return;

    setActiveStep(1);
    await delay(500);
    const qEmbed = generateEmbedding(query);
    setQueryEmbedding(qEmbed);

    setActiveStep(2);
    await delay(400);
    const withSimilarity = documents.map(doc => ({
      ...doc,
      similarity: cosineSimilarity(qEmbed, doc.embedding)
    }));

    setActiveStep(3);
    await delay(300);
    const ranked = withSimilarity
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, 10);
    setResults(ranked);

    setActiveStep(4);
  };

  const reset = () => {
    setQuery("");
    setQueryEmbedding(null);
    setResults([]);
    setActiveStep(0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">RAG Pipeline Demo</h2>
            <p className="text-sm text-gray-600 mt-1">
              Semantic search on your CSV data using vector embeddings
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Indexed Documents</div>
              <div className="text-2xl font-bold text-blue-600">{indexedCount.toLocaleString()}</div>
            </div>

            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isIndexing}
              />
            </label>
          </div>
        </div>

        {isIndexing && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Indexing documents...</span>
              <span>{indexingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${indexingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Flow</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
          <PipelineStep
            icon="📝"
            label="Query"
            description={query || "Enter search"}
            active={activeStep >= 1}
          />
          <Arrow />
          <PipelineStep
            icon="🧠"
            label="Embed"
            description="AWS Bedrock"
            active={activeStep >= 1}
            highlight={activeStep === 1}
          />
          <Arrow />
          <PipelineStep
            icon="🔍"
            label="Search"
            description="pgvector"
            active={activeStep >= 2}
            highlight={activeStep === 2}
          />
          <Arrow />
          <PipelineStep
            icon="📊"
            label="Rank"
            description="Top K"
            active={activeStep >= 3}
            highlight={activeStep === 3}
          />
          <Arrow />
          <PipelineStep
            icon="✅"
            label="Results"
            description={`${results.length} found`}
            active={activeStep >= 4}
            highlight={activeStep === 4}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Semantic Search</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search your data
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runRAGSearch()}
                placeholder="e.g., Charlie, Smith, img_093..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={documents.length === 0 || isIndexing}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={runRAGSearch}
                disabled={!query || documents.length === 0 || isIndexing || (activeStep > 0 && activeStep < 4)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {activeStep > 0 && activeStep < 4 ? "Searching..." : "Search"}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>

            {queryEmbedding && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">Query Embedding Vector:</div>
                <div className="flex flex-wrap gap-1">
                  {queryEmbedding.slice(0, 16).map((val, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded flex items-center justify-center text-xs font-mono"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${val})`,
                        color: val > 0.5 ? "white" : "black"
                      }}
                      title={val.toFixed(4)}
                    >
                      {val.toFixed(1)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="text-sm text-gray-500 mb-2">Try these:</div>
              <div className="flex flex-wrap gap-2">
                {["Javl", "Jack", "Chuck", "Charlie", "Bob"].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setQuery(sample)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Search Results
            {results.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Top {results.length} by similarity)
              </span>
            )}
          </h3>

          {results.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    index === 0
                      ? "border-green-400 bg-green-50"
                      : index < 3
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">#{result.id}</span>
                        <span className="font-medium text-gray-900 truncate">{result.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">{result.image_id}</div>

                      <div className="flex gap-0.5 mt-1">
                        {result.embedding.slice(0, 8).map((val, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: `rgba(99, 102, 241, ${val})` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500">Match</div>
                      <div className={`text-lg font-bold ${
                        (result.similarity || 0) > 0.9 ? "text-green-600" :
                        (result.similarity || 0) > 0.7 ? "text-blue-600" : "text-gray-600"
                      }`}>
                        {((result.similarity || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📂</div>
              <div>Upload a CSV to index documents</div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🔍</div>
              <div>Enter a search query to find similar documents</div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function PipelineStep({
  icon,
  label,
  description,
  active,
  highlight,
}: {
  icon: string;
  label: string;
  description: string;
  active?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        flex flex-col items-center p-3 rounded-lg transition-all min-w-[80px]
        ${highlight ? "bg-blue-100 ring-2 ring-blue-400 scale-110" : ""}
        ${active ? "opacity-100" : "opacity-40"}
      `}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-medium text-gray-900 text-sm">{label}</div>
      <div className="text-xs text-gray-500 truncate max-w-[80px]">{description}</div>
    </div>
  );
}

function Arrow() {
  return <span className="text-gray-400 text-xl flex-shrink-0">→</span>;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
