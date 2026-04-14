export type FeedbackCategory =
  | "bug"
  | "feature_request"
  | "elogio"
  | "pain_point"
  | "no_clasificable"
  | "error";

export type Sentiment = "positive" | "negative" | "neutral";

export type OverallSentiment = "positive" | "negative" | "neutral" | "mixed";

export interface FeedbackItem {
  id: string;
  text: string;
  category: FeedbackCategory;
  sentiment: Sentiment;
  createdAt: string;
}

export interface AnalyzeFeedbackResponse {
  items: Array<{
    text: string;
    category: FeedbackCategory;
    sentiment: Sentiment;
  }>;
  summary: {
    total: number;
    by_category: Record<FeedbackCategory, number>;
    overall_sentiment: OverallSentiment;
  };
}
