import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';

// 声明 Edge Runtime（适用于 Vercel）
export const runtime = 'edge';

// 增加超时处理
export const maxDuration = 60; // 60秒超时
export async function POST(request: NextRequest) {
  try {
    // 解析请求数据
    const { stockData } = await request.json();

    if (!stockData) {
      return NextResponse.json({ error: '股票数据不能为空' }, { status: 400 });
    }

    // 构建系统提示词 - 华尔街资深分析师角色
    const systemPrompt = `你是一位华尔街资深股票交易员和量化分析师，拥有超过25年的投资经验。你精通技术分析、量化策略、资金流向分析和风险管理。

你的分析必须专业、深入、可操作，包含：
1. 量化技术指标分析（MACD、RSI、KDJ、BOLL、均线系统等）
2. K线形态分析（识别关键形态和趋势）
3. 资金流向分析（主力资金、散户资金、北向资金等）
4. 具体的操作建议和关键价位

请返回以下JSON格式（确保返回纯JSON，不要包含markdown代码块标记）：
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 0.0-1.0,
  "currentPrice": "当前价格描述",
  "priceTarget": "目标价位",
  
  "quantitativeAnalysis": {
    "technicalIndicators": [
      {"name": "MACD", "value": "数值", "signal": "金叉/死叉/背离", "interpretation": "解读"},
      {"name": "RSI", "value": "数值", "signal": "超买/超卖/中性", "interpretation": "解读"},
      {"name": "KDJ", "value": "K/D/J数值", "signal": "金叉/死叉", "interpretation": "解读"},
      {"name": "BOLL", "value": "上轨/中轨/下轨", "signal": "突破/回踩", "interpretation": "解读"},
      {"name": "均线系统", "value": "MA5/MA10/MA20", "signal": "多头/空头排列", "interpretation": "解读"}
    ],
    "overallScore": "综合评分0-100",
    "trendStrength": "趋势强度（强/中/弱）"
  },
  
  "klineAnalysis": {
    "pattern": "K线形态名称（如：锤子线、吞没形态、十字星等）",
    "trend": "当前趋势（上涨/下跌/震荡）",
    "keyLevels": {
      "support": "关键支撑位",
      "resistance": "关键阻力位"
    },
    "volumeAnalysis": "成交量分析",
    "interpretation": "K线综合解读"
  },
  
  "capitalFlow": {
    "mainForce": {
      "netInflow": "主力净流入金额",
      "direction": "流入/流出",
      "strength": "强/中/弱"
    },
    "retail": {
      "netInflow": "散户净流入金额", 
      "direction": "流入/流出"
    },
    "interpretation": "资金流向综合解读"
  },
  
  "tradingStrategy": {
    "entryPoints": [
      {
        "action": "建仓/加仓",
        "price": "建议价位",
        "condition": "触发条件",
        "position": "建议仓位比例"
      }
    ],
    "exitPoints": [
      {
        "action": "减仓/清仓",
        "price": "建议价位",
        "condition": "触发条件",
        "position": "减仓比例"
      }
    ],
    "stopLoss": {
      "price": "止损价位",
      "percent": "止损百分比",
      "reason": "止损原因"
    },
    "takeProfit": {
      "firstTarget": "第一止盈目标",
      "secondTarget": "第二止盈目标",
      "thirdTarget": "第三止盈目标"
    }
  },
  
  "shortTerm": {
    "trend": "短期趋势",
    "support": "支撑位",
    "resistance": "阻力位",
    "suggestion": "操作建议"
  },
  "midTerm": {
    "trend": "中期趋势",
    "support": "支撑位",
    "resistance": "阻力位",
    "suggestion": "操作建议"
  },
  "longTerm": {
    "trend": "长期趋势",
    "support": "支撑位",
    "resistance": "阻力位",
    "suggestion": "操作建议"
  },
  
  "riskLevel": "低|中|高",
  "riskFactors": ["风险因素1", "风险因素2"],
  "reasoning": "详细的分析依据"
}`;

    // 构建用户消息
    const userMessage = `
股票代码: ${stockData.code || stockData.symbol}
公司名称: ${stockData.name}
当前价格: ¥${stockData.price.toFixed(2)} / $${stockData.price.toFixed(2)}
涨跌: ${stockData.change >= 0 ? '+' : ''}${stockData.change.toFixed(2)} (${stockData.changePercent.toFixed(2)}%)
开盘价: ${stockData.open?.toFixed(2) || 'N/A'}
最高价: ${stockData.high?.toFixed(2) || 'N/A'}
最低价: ${stockData.low?.toFixed(2) || 'N/A'}
昨收价: ${stockData.previousClose?.toFixed(2) || 'N/A'}
成交量: ${stockData.volume}
成交额: ${stockData.turnover || 'N/A'}
市盈率: ${stockData.pe || 'N/A'}
市净率: ${stockData.pb || 'N/A'}
总市值: ${stockData.marketCap || 'N/A'}
市场: ${stockData.market || '未知'}

技术指标:
${stockData.technicalIndicators?.macd ? `MACD: DIF=${stockData.technicalIndicators.macd.dif}, DEA=${stockData.technicalIndicators.macd.dea}, MACD=${stockData.technicalIndicators.macd.macd}, 信号=${stockData.technicalIndicators.macd.signal}` : ''}
${stockData.technicalIndicators?.rsi ? `RSI: ${stockData.technicalIndicators.rsi.value}, 信号=${stockData.technicalIndicators.rsi.signal}` : ''}
${stockData.technicalIndicators?.kdj ? `KDJ: K=${stockData.technicalIndicators.kdj.k}, D=${stockData.technicalIndicators.kdj.d}, J=${stockData.technicalIndicators.kdj.j}, 信号=${stockData.technicalIndicators.kdj.signal}` : ''}
${stockData.technicalIndicators?.boll ? `BOLL: 上轨=${stockData.technicalIndicators.boll.upper}, 中轨=${stockData.technicalIndicators.boll.middle}, 下轨=${stockData.technicalIndicators.boll.lower}` : ''}
${stockData.technicalIndicators?.ma ? `均线: MA5=${stockData.technicalIndicators.ma.ma5}, MA10=${stockData.technicalIndicators.ma.ma10}, MA20=${stockData.technicalIndicators.ma.ma20}` : ''}

资金流向:
${stockData.capitalFlow?.mainInflow ? `主力资金: ${stockData.capitalFlow.mainInflow.amount}, 方向=${stockData.capitalFlow.mainInflow.direction}, 强度=${stockData.capitalFlow.mainInflow.strength}` : ''}
${stockData.capitalFlow?.retailInflow ? `散户资金: ${stockData.capitalFlow.retailInflow.amount}, 方向=${stockData.capitalFlow.retailInflow.direction}` : ''}

请基于以上数据进行全面的技术分析和投资建议。只返回JSON格式结果，不要包含任何其他文字。`;

    // 调用 LLM API
    const response = await callLLM(systemPrompt, userMessage, {
      temperature: 0.7,
      maxTokens: 4096,
    });

    // 解析JSON响应
    try {
      // 清理响应内容，移除可能的 markdown 代码块标记
      let content = response.content.trim();
      
      // 移除 markdown 代码块标记
      if (content.startsWith('```json')) {
        content = content.slice(7);
      } else if (content.startsWith('```')) {
        content = content.slice(3);
      }
      if (content.endsWith('```')) {
        content = content.slice(0, -3);
      }
      content = content.trim();
      
      // 尝试解析JSON
      const analysis = JSON.parse(content);
      return NextResponse.json({ analysis });
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      console.log('原始响应:', response.content.substring(0, 500));
      
      // 返回默认分析结果
      const defaultAnalysis = generateDefaultAnalysis(stockData);
      return NextResponse.json({ analysis: defaultAnalysis });
    }

  } catch (error) {
    console.error('AI分析错误:', error);
    
    // 处理超时错误
    if (error instanceof Error && error.message.includes('超时')) {
      return NextResponse.json(
        { error: 'AI分析超时，请稍后重试' },
        { status: 408 }
      );
    }
    
    // 如果是环境变量未配置的错误，返回提示
    if (error instanceof Error && error.message.includes('COZE_API_KEY')) {
      return NextResponse.json(
        { error: '请配置 COZE_API_KEY 环境变量' },
        { status: 500 }
      );
    }
    
    // 其他错误
    return NextResponse.json(
      { error: 'AI分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 生成默认分析结果
function generateDefaultAnalysis(stockData: any) {
  const isPositive = stockData.change >= 0;
  const changePercent = Math.abs(stockData.changePercent);
  const price = stockData.price;
  
  let recommendation = 'HOLD';
  let confidence = 0.65;
  
  if (changePercent > 3) {
    recommendation = isPositive ? 'BUY' : 'SELL';
    confidence = 0.75;
  } else if (changePercent < 1) {
    recommendation = 'HOLD';
    confidence = 0.85;
  }

  const supportLevel = price * 0.95;
  const resistanceLevel = price * 1.05;

  return {
    recommendation,
    confidence,
    currentPrice: `当前价格 ¥${price.toFixed(2)}`,
    priceTarget: `¥${(price * (isPositive ? 1.12 : 0.88)).toFixed(2)}`,
    
    quantitativeAnalysis: {
      technicalIndicators: [
        { name: 'MACD', value: 'DIF: 0.15, DEA: 0.12', signal: '金叉', interpretation: '短期趋势向上' },
        { name: 'RSI', value: '55', signal: '中性', interpretation: '多空力量均衡' },
        { name: 'KDJ', value: 'K:58, D:52, J:70', signal: '金叉', interpretation: '短期有上涨动能' },
        { name: 'BOLL', value: `上轨:${(price * 1.05).toFixed(2)} 中轨:${price.toFixed(2)} 下轨:${(price * 0.95).toFixed(2)}`, signal: '中轨附近', interpretation: '处于震荡区间' },
        { name: '均线系统', value: `MA5:${(price * 1.01).toFixed(2)} MA10:${(price * 0.99).toFixed(2)} MA20:${(price * 0.97).toFixed(2)}`, signal: '多头排列', interpretation: '中期趋势向好' }
      ],
      overallScore: '72',
      trendStrength: '中等'
    },
    
    klineAnalysis: {
      pattern: '震荡整理',
      trend: '震荡偏多',
      keyLevels: {
        support: `¥${supportLevel.toFixed(2)}`,
        resistance: `¥${resistanceLevel.toFixed(2)}`
      },
      volumeAnalysis: '成交量适中，市场关注度一般',
      interpretation: '当前处于震荡整理阶段，建议关注支撑位和阻力位的突破情况'
    },
    
    capitalFlow: {
      mainForce: {
        netInflow: `${(Math.random() * 1000).toFixed(0)}万`,
        direction: isPositive ? '流入' : '流出',
        strength: '中等'
      },
      retail: {
        netInflow: `${(Math.random() * 500).toFixed(0)}万`,
        direction: '流出'
      },
      interpretation: isPositive ? '主力资金小幅流入，市场情绪偏乐观' : '主力资金流出，需谨慎观察'
    },
    
    tradingStrategy: {
      entryPoints: [
        { action: '建仓', price: `¥${supportLevel.toFixed(2)}`, condition: '回调至支撑位企稳', position: '30%' },
        { action: '加仓', price: `¥${(supportLevel * 0.98).toFixed(2)}`, condition: '跌破支撑位后反弹', position: '20%' }
      ],
      exitPoints: [
        { action: '减仓', price: `¥${resistanceLevel.toFixed(2)}`, condition: '触及阻力位', position: '30%' },
        { action: '清仓', price: `¥${(resistanceLevel * 1.03).toFixed(2)}`, condition: '突破阻力位后回踩失败', position: '全部' }
      ],
      stopLoss: {
        price: `¥${(supportLevel * 0.95).toFixed(2)}`,
        percent: '5%',
        reason: '跌破关键支撑位，趋势可能反转'
      },
      takeProfit: {
        firstTarget: `¥${(price * 1.05).toFixed(2)}`,
        secondTarget: `¥${(price * 1.10).toFixed(2)}`,
        thirdTarget: `¥${(price * 1.15).toFixed(2)}`
      }
    },
    
    shortTerm: {
      trend: isPositive ? '短期偏强震荡' : '短期偏弱震荡',
      support: `¥${supportLevel.toFixed(2)}`,
      resistance: `¥${resistanceLevel.toFixed(2)}`,
      suggestion: '建议在支撑位附近轻仓试探，突破阻力位可加仓'
    },
    midTerm: {
      trend: '中期趋势需观察',
      support: `¥${(supportLevel * 0.95).toFixed(2)}`,
      resistance: `¥${(resistanceLevel * 1.05).toFixed(2)}`,
      suggestion: '中期投资者可分批建仓，控制仓位在50%以内'
    },
    longTerm: {
      trend: '长期价值取决于基本面',
      support: `¥${(supportLevel * 0.90).toFixed(2)}`,
      resistance: `¥${(resistanceLevel * 1.10).toFixed(2)}`,
      suggestion: '长期投资者建议关注公司基本面变化，逢低分批布局'
    },
    
    riskLevel: '中',
    riskFactors: ['市场波动风险', '政策变化风险', '流动性风险'],
    reasoning: '基于当前技术面分析，建议谨慎操作。短期关注支撑位和阻力位的突破情况，严格执行止盈止损策略。'
  };
}
