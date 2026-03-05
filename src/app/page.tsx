'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  AlertCircle, 
  Target, 
  BarChart3,
  Activity,
  DollarSign,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot
} from 'lucide-react';

interface StockData {
  code: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  turnover: string;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  pe?: number;
  pb?: number;
  marketCap: string;
  eps?: number;
  roe?: number;
  market: string;
  technicalIndicators?: {
    macd?: {
      dif: number;
      dea: number;
      macd: number;
      signal: string;
    };
    rsi?: {
      value: number;
      signal: string;
    };
    kdj?: {
      k: number;
      d: number;
      j: number;
      signal: string;
    };
    boll?: {
      upper: number;
      middle: number;
      lower: number;
      signal: string;
    };
    ma?: {
      ma5: number;
      ma10: number;
      ma20: number;
      signal: string;
    };
  };
  capitalFlow?: {
    mainInflow?: {
      amount: string;
      direction: string;
      strength: string;
    };
    retailInflow?: {
      amount: string;
      direction: string;
    };
  };
  error?: string;
}

interface AnalysisResult {
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  currentPrice: string;
  priceTarget: string;
  quantitativeAnalysis: {
    technicalIndicators: Array<{
      name: string;
      value: string;
      signal: string;
      interpretation: string;
    }>;
    overallScore: string;
    trendStrength: string;
  };
  klineAnalysis: {
    pattern: string;
    trend: string;
    keyLevels: {
      support: string;
      resistance: string;
    };
    volumeAnalysis: string;
    interpretation: string;
  };
  capitalFlow: {
    mainForce: {
      netInflow: string;
      direction: string;
      strength: string;
    };
    retail: {
      netInflow: string;
      direction: string;
    };
    interpretation: string;
  };
  tradingStrategy: {
    entryPoints: Array<{
      action: string;
      price: string;
      condition: string;
      position: string;
    }>;
    exitPoints: Array<{
      action: string;
      price: string;
      condition: string;
      position: string;
    }>;
    stopLoss: {
      price: string;
      percent: string;
      reason: string;
    };
    takeProfit: {
      firstTarget: string;
      secondTarget: string;
      thirdTarget: string;
    };
  };
  shortTerm: {
    trend: string;
    support: string;
    resistance: string;
    suggestion: string;
  };
  midTerm: {
    trend: string;
    support: string;
    resistance: string;
    suggestion: string;
  };
  longTerm: {
    trend: string;
    support: string;
    resistance: string;
    suggestion: string;
  };
  riskLevel: string;
  riskFactors: string[];
  reasoning: string;
}

export default function InvestmentAdvisor() {
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const fetchStockData = async () => {
    if (!stockSymbol.trim()) {
      setError('请输入股票代码或名称');
      return;
    }

    setLoading(true);
    setError('');
    setStockData(null);
    setAnalysis(null);

    try {
      const stockRes = await fetch('/api/stock/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: stockSymbol.trim() }),
      });

      if (!stockRes.ok) throw new Error('获取股票数据失败');
      
      const stockResult = await stockRes.json();
      setStockData(stockResult);

      if (stockResult.price > 0) {
        await analyzeStock(stockResult);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const analyzeStock = async (stock: StockData) => {
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/stock/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: stock }),
      });

      if (!response.ok) throw new Error('AI分析失败');

      const result = await response.json();
      setAnalysis(result.analysis);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'SELL': return 'bg-rose-500 hover:bg-rose-600';
      case 'HOLD': return 'bg-amber-500 hover:bg-amber-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'BUY': return '买入';
      case 'SELL': return '卖出';
      case 'HOLD': return '持有';
      default: return '观望';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'BUY': return <TrendingUp className="w-5 h-5" />;
      case 'SELL': return <TrendingDown className="w-5 h-5" />;
      case 'HOLD': return <Minus className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              QUANT PRO
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            AI量化投资分析系统 · 华尔街级专业策略
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 backdrop-blur-xl bg-slate-900/50 border-amber-500/20 shadow-xl shadow-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="输入股票代码或名称（如：000592 平潭发展、AAPL 苹果）"
                  value={stockSymbol}
                  onChange={(e) => setStockSymbol(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchStockData()}
                  className="pl-12 h-14 text-lg bg-slate-800/50 border-slate-700 focus:border-amber-500 text-white placeholder:text-slate-500"
                />
              </div>
              <Button 
                onClick={fetchStockData} 
                disabled={loading}
                className="h-14 px-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    分析中
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    开始分析
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        {(stockData || analyzing) && (
          <div className="space-y-6">
            {/* Stock Info & AI Recommendation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stock Info Card */}
              <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700 shadow-xl">
                <CardHeader className="border-b border-slate-700/50">
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <DollarSign className="w-5 h-5" />
                    股票信息
                  </CardTitle>
                  <CardDescription className="text-slate-400">实时行情数据</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {stockData ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-2xl font-bold text-white">{stockData.name}</h3>
                            <p className="text-slate-400 text-sm">{stockData.code} · {stockData.market}</p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-bold text-white">¥{stockData.price.toFixed(2)}</span>
                          <span className={`text-lg font-semibold flex items-center gap-1 ${stockData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stockData.change >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      
                      <Separator className="bg-slate-700" />
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-800/50 p-2 rounded">
                          <span className="text-slate-400">开盘价</span>
                          <p className="font-semibold text-white">¥{stockData.open?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded">
                          <span className="text-slate-400">昨收价</span>
                          <p className="font-semibold text-white">¥{stockData.previousClose?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded">
                          <span className="text-slate-400">最高价</span>
                          <p className="font-semibold text-emerald-400">¥{stockData.high?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded">
                          <span className="text-slate-400">最低价</span>
                          <p className="font-semibold text-rose-400">¥{stockData.low?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded">
                          <span className="text-slate-400">成交量</span>
                          <p className="font-semibold text-white">{stockData.volume}</p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded">
                          <span className="text-slate-400">成交额</span>
                          <p className="font-semibold text-white">{stockData.turnover || 'N/A'}</p>
                        </div>
                      </div>

                      <Separator className="bg-slate-700" />

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <span className="text-slate-400 text-xs">市盈率</span>
                          <p className="font-semibold text-white">{stockData.pe?.toFixed(1) || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 text-xs">市净率</span>
                          <p className="font-semibold text-white">{stockData.pb?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 text-xs">总市值</span>
                          <p className="font-semibold text-white">{stockData.marketCap || 'N/A'}</p>
                        </div>
                      </div>

                      {/* 原始技术指标（从股票数据获取） */}
                      {stockData.technicalIndicators && (
                        <>
                          <Separator className="bg-slate-700" />
                          <div className="text-xs">
                            <p className="text-slate-500 mb-2">技术指标快览</p>
                            <div className="grid grid-cols-2 gap-2">
                              {stockData.technicalIndicators.macd && (
                                <div className="bg-slate-800/30 p-2 rounded">
                                  <span className="text-slate-500">MACD</span>
                                  <p className="text-white">{stockData.technicalIndicators.macd.signal}</p>
                                </div>
                              )}
                              {stockData.technicalIndicators.rsi && (
                                <div className="bg-slate-800/30 p-2 rounded">
                                  <span className="text-slate-500">RSI</span>
                                  <p className="text-white">{stockData.technicalIndicators.rsi.value.toFixed(0)} ({stockData.technicalIndicators.rsi.signal})</p>
                                </div>
                              )}
                              {stockData.technicalIndicators.kdj && (
                                <div className="bg-slate-800/30 p-2 rounded">
                                  <span className="text-slate-500">KDJ</span>
                                  <p className="text-white">{stockData.technicalIndicators.kdj.signal}</p>
                                </div>
                              )}
                              {stockData.technicalIndicators.ma && (
                                <div className="bg-slate-800/30 p-2 rounded">
                                  <span className="text-slate-500">均线</span>
                                  <p className="text-white">{stockData.technicalIndicators.ma.signal}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* 资金流向快览 */}
                      {stockData.capitalFlow?.mainInflow && (
                        <>
                          <Separator className="bg-slate-700" />
                          <div className="text-xs">
                            <p className="text-slate-500 mb-2">资金流向</p>
                            <div className="bg-slate-800/30 p-2 rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">主力资金</span>
                                <span className={stockData.capitalFlow.mainInflow.direction === '流入' ? 'text-emerald-400' : 'text-rose-400'}>
                                  {stockData.capitalFlow.mainInflow.amount} ({stockData.capitalFlow.mainInflow.direction})
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Recommendation */}
              <Card className="lg:col-span-2 backdrop-blur-xl bg-slate-900/50 border-slate-700 shadow-xl">
                <CardHeader className="border-b border-slate-700/50">
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <Target className="w-5 h-5" />
                    AI 投资建议
                  </CardTitle>
                  <CardDescription className="text-slate-400">华尔街资深分析师视角</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {analyzing ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
                      <p className="text-slate-300 text-lg">AI 分析师正在研究数据...</p>
                      <p className="text-sm text-slate-500 mt-2">综合技术指标、资金流向和市场趋势</p>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-6">
                      {/* Main Recommendation */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-800/30 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-4">
                          <Badge className={`${getRecommendationColor(analysis.recommendation)} text-white text-lg px-5 py-2 shadow-lg`}>
                            {getRecommendationIcon(analysis.recommendation)}
                            <span className="ml-2">{getRecommendationText(analysis.recommendation)}</span>
                          </Badge>
                          <div>
                            <p className="text-slate-400 text-sm">信心度</p>
                            <p className="text-white font-semibold text-lg">{(analysis.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">目标价位</p>
                          <p className="text-2xl font-bold text-amber-400">{analysis.priceTarget}</p>
                        </div>
                      </div>

                      {/* Trading Strategy */}
                      <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          关键价位与操作建议
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                            <h5 className="font-semibold text-emerald-400 mb-2 text-sm">建仓建议</h5>
                            {analysis.tradingStrategy.entryPoints.map((point, idx) => (
                              <div key={idx} className="text-sm text-slate-300 mb-2 last:mb-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-emerald-400">{point.action}</span>
                                  <span className="text-white font-semibold">{point.price}</span>
                                </div>
                                <p className="text-slate-400 text-xs">{point.condition} · 仓位 {point.position}</p>
                              </div>
                            ))}
                          </div>

                          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                            <h5 className="font-semibold text-rose-400 mb-2 text-sm">减仓/清仓建议</h5>
                            {analysis.tradingStrategy.exitPoints.map((point, idx) => (
                              <div key={idx} className="text-sm text-slate-300 mb-2 last:mb-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-rose-400">{point.action}</span>
                                  <span className="text-white font-semibold">{point.price}</span>
                                </div>
                                <p className="text-slate-400 text-xs">{point.condition} · {point.position}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Stop Loss & Take Profit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                            <h5 className="font-semibold text-rose-400 mb-2 flex items-center gap-1 text-sm">
                              <Shield className="w-4 h-4" />
                              止损建议
                            </h5>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-slate-400 text-sm">止损价</span>
                              <span className="text-rose-400 font-semibold">{analysis.tradingStrategy.stopLoss.price}</span>
                            </div>
                            <p className="text-slate-500 text-xs">{analysis.tradingStrategy.stopLoss.reason}</p>
                          </div>

                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                            <h5 className="font-semibold text-emerald-400 mb-2 flex items-center gap-1 text-sm">
                              <TrendingUp className="w-4 h-4" />
                              止盈目标
                            </h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">第一目标</span>
                                <span className="text-emerald-400">{analysis.tradingStrategy.takeProfit.firstTarget}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">第二目标</span>
                                <span className="text-emerald-400">{analysis.tradingStrategy.takeProfit.secondTarget}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">第三目标</span>
                                <span className="text-emerald-400">{analysis.tradingStrategy.takeProfit.thirdTarget}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Risk */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">风险等级:</span>
                          <Badge variant={analysis.riskLevel === '高' ? 'destructive' : analysis.riskLevel === '中' ? 'default' : 'secondary'}>
                            {analysis.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <Target className="w-12 h-12 mb-4 opacity-50" />
                      <p>输入股票代码开始分析</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quantitative Analysis, K-line, Capital Flow */}
            {analysis && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quantitative Analysis */}
                <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700 shadow-xl">
                  <CardHeader className="border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
                      <Activity className="w-4 h-4" />
                      量化指标分析
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      综合评分: <span className="text-amber-400 font-semibold">{analysis.quantitativeAnalysis.overallScore}</span>
                      · 趋势强度: <span className="text-white">{analysis.quantitativeAnalysis.trendStrength}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {analysis.quantitativeAnalysis.technicalIndicators.map((indicator, idx) => (
                        <div key={idx} className="bg-slate-800/30 p-3 rounded border border-slate-700/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-white text-sm">{indicator.name}</span>
                            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                              {indicator.signal}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-xs mb-1">{indicator.value}</p>
                          <p className="text-slate-500 text-xs">{indicator.interpretation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* K-line Analysis */}
                <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700 shadow-xl">
                  <CardHeader className="border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
                      <BarChart3 className="w-4 h-4" />
                      K线形态分析
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      当前趋势: <span className="text-amber-400 font-semibold">{analysis.klineAnalysis.trend}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="bg-slate-800/30 p-3 rounded border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">形态识别</p>
                        <p className="text-white font-semibold">{analysis.klineAnalysis.pattern}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                          <p className="text-slate-400 text-xs">支撑位</p>
                          <p className="text-emerald-400 font-semibold">{analysis.klineAnalysis.keyLevels.support}</p>
                        </div>
                        <div className="bg-rose-500/10 p-2 rounded border border-rose-500/20">
                          <p className="text-slate-400 text-xs">阻力位</p>
                          <p className="text-rose-400 font-semibold">{analysis.klineAnalysis.keyLevels.resistance}</p>
                        </div>
                      </div>

                      <div className="bg-slate-800/30 p-3 rounded border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">成交量分析</p>
                        <p className="text-slate-300 text-sm">{analysis.klineAnalysis.volumeAnalysis}</p>
                      </div>

                      <div className="text-slate-400 text-sm">
                        {analysis.klineAnalysis.interpretation}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Capital Flow */}
                <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700 shadow-xl">
                  <CardHeader className="border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
                      <CircleDot className="w-4 h-4" />
                      资金流向分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="bg-slate-800/30 p-3 rounded border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400 text-sm">主力资金</span>
                          <Badge className={`${analysis.capitalFlow.mainForce.direction === '流入' ? 'bg-emerald-500' : 'bg-rose-500'} text-white text-xs`}>
                            {analysis.capitalFlow.mainForce.direction}
                          </Badge>
                        </div>
                        <p className="text-white font-semibold text-lg">{analysis.capitalFlow.mainForce.netInflow}</p>
                        <p className="text-slate-500 text-xs mt-1">强度: {analysis.capitalFlow.mainForce.strength}</p>
                      </div>

                      <div className="bg-slate-800/30 p-3 rounded border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400 text-sm">散户资金</span>
                          <Badge className={`${analysis.capitalFlow.retail.direction === '流入' ? 'bg-emerald-500' : 'bg-rose-500'} text-white text-xs`}>
                            {analysis.capitalFlow.retail.direction}
                          </Badge>
                        </div>
                        <p className="text-white font-semibold">{analysis.capitalFlow.retail.netInflow}</p>
                      </div>

                      <div className="bg-slate-800/30 p-3 rounded border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">综合解读</p>
                        <p className="text-slate-300 text-sm">{analysis.capitalFlow.interpretation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Short/Mid/Long Term Analysis */}
            {analysis && (
              <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700 shadow-xl">
                <CardHeader className="border-b border-slate-700/50">
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <Target className="w-5 h-5" />
                    周期分析
                  </CardTitle>
                  <CardDescription className="text-slate-400">短中长期操作建议</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-blue-500/30 bg-blue-500/5 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        短期 (1-4周)
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-400">趋势:</span>
                          <p className="text-white">{analysis.shortTerm.trend}</p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-slate-400">支撑:</span>
                            <p className="text-emerald-400">{analysis.shortTerm.support}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">阻力:</span>
                            <p className="text-rose-400">{analysis.shortTerm.resistance}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">建议:</span>
                          <p className="text-blue-400">{analysis.shortTerm.suggestion}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        中期 (1-6月)
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-400">趋势:</span>
                          <p className="text-white">{analysis.midTerm.trend}</p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-slate-400">支撑:</span>
                            <p className="text-emerald-400">{analysis.midTerm.support}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">阻力:</span>
                            <p className="text-rose-400">{analysis.midTerm.resistance}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">建议:</span>
                          <p className="text-indigo-400">{analysis.midTerm.suggestion}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-purple-500/30 bg-purple-500/5 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        长期 (6月+)
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-400">趋势:</span>
                          <p className="text-white">{analysis.longTerm.trend}</p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-slate-400">支撑:</span>
                            <p className="text-emerald-400">{analysis.longTerm.support}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">阻力:</span>
                            <p className="text-rose-400">{analysis.longTerm.resistance}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">建议:</span>
                          <p className="text-purple-400">{analysis.longTerm.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Factors & Reasoning */}
            {analysis && (
              <Card className="backdrop-blur-xl bg-slate-900/50 border-slate-700 shadow-xl">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-500" />
                        风险因素
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.riskFactors.map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="border-rose-500/50 text-rose-400">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">分析依据</h4>
                      <p className="text-slate-400 text-sm leading-relaxed bg-slate-800/30 p-3 rounded border border-slate-700/50">
                        {analysis.reasoning}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 text-center text-sm text-slate-500 bg-slate-800/20 p-4 rounded-lg border border-slate-700/50">
          <p className="flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            免责声明：本工具提供的分析建议仅供参考，不构成投资建议。投资有风险，入市需谨慎。
          </p>
        </div>
      </div>
    </div>
  );
}
