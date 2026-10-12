import React from 'react';
import AIReport from './AIReport';

// The same structured renderer serves the immediate response and saved history.
export default function AIResultDisplay({ result }) {
  if (result === null || result === undefined) return null;
  return <AIReport response={result} title={result?.title || 'AI analysis'} />;
}
