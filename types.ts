
import React from 'react';

export enum ViewType {
  DASHBOARD = 'Dashboard',
  WEEKLY = 'Weekly',
  MAPS = 'Maps',
  ENGAGEMENT = 'Engagement',
  GRIEVANCE = 'Grievance'
}

export interface Grievance {
  id: string;
  community: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved' | 'Pending';
  date: string;
}

export interface StatItem {
  label: string;
  value: string | number;
  // Added React import to resolve namespace issue
  icon: React.ReactNode;
  color: string;
}

export interface WeeklyActivity {
  day: string;
  activity: string;
  location: string;
  time: string;
}