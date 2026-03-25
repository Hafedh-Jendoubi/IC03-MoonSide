'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Play, Clock, Users } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Advanced UX Design Principles',
    instructor: 'Sarah Johnson',
    duration: '4 weeks',
    students: 1250,
    progress: 75,
    image: 'UX',
  },
  {
    id: 2,
    title: 'Product Management Fundamentals',
    instructor: 'Michael Chen',
    duration: '6 weeks',
    students: 2100,
    progress: 40,
    image: 'PM',
  },
  {
    id: 3,
    title: 'Data Analytics for Decision Making',
    instructor: 'Emma Williams',
    duration: '5 weeks',
    students: 890,
    progress: 10,
    image: 'DA',
  },
];

export default function LearningPage() {
  return (
    <DashboardLayout className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Learning</h1>
          <p className="text-foreground-secondary mt-1">Continue your professional development</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Courses', value: '3' },
            { label: 'In Progress', value: '2' },
            { label: 'Completed', value: '1' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-foreground-secondary">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-foreground">Your Courses</h2>
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card key={course.id} hoverable>
                <CardContent className="p-6">
                  <div className="flex gap-4 md:gap-6">
                    <div className="w-20 h-20 rounded bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {course.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg">{course.title}</h3>
                      <p className="text-sm text-foreground-secondary mt-1">By {course.instructor}</p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-foreground-secondary">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.students.toLocaleString()} students
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 w-full">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-foreground-secondary">Progress</span>
                          <span className="text-xs font-medium text-foreground">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="primary" size="md" className="gap-2 flex-shrink-0">
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">Continue</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Browse Courses */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Browse Courses</h2>
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
              <p className="text-foreground-secondary mb-4">Explore our catalog of professional development courses</p>
              <Button variant="primary">Browse All Courses</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
