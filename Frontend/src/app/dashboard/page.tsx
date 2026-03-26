'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Heart, MessageCircle, Share2, ImagePlus, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  return (
    <DashboardLayout className="p-4 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Composer Card */}
        <Card className="border-border/40 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar size="md" initials="JD" />
              <div className="flex-1">
                <textarea
                  placeholder="What's on your mind?"
                  className="w-full h-12 bg-background-secondary border border-border/40 rounded-lg px-4 py-3 text-sm text-foreground placeholder-foreground-secondary/60 outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-background-secondary rounded-lg transition-colors text-foreground-secondary hover:text-foreground">
                      <ImagePlus className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-background-secondary rounded-lg transition-colors text-foreground-secondary hover:text-foreground">
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>
                  <Button className="bg-primary hover:bg-primary-dark text-white">
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Posts */}
        {[1, 2, 3].map((idx) => (
          <Card key={idx} className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              {/* Post Header */}
              <div className="flex justify-between items-start mb-5">
                <div className="flex gap-3">
                  <Avatar size="md" initials="JS" />
                  <div>
                    <p className="font-semibold text-foreground">Jane Smith</p>
                    <p className="text-xs text-foreground-secondary">@janesmith • 2h ago</p>
                  </div>
                </div>
                <button className="text-foreground-secondary hover:text-foreground p-1 rounded hover:bg-background-secondary transition-colors">
                  <span className="text-lg">•••</span>
                </button>
              </div>

              {/* Post Content */}
              <p className="text-foreground mb-5 leading-relaxed">
                Excited to announce that I&apos;ve just completed the Professional Development course in UX Design! It&apos;s been an incredible journey learning from industry experts and building real-world projects. Here&apos;s what I learned...
              </p>

              {/* Post Actions */}
              <div className="flex gap-6 text-foreground-secondary text-sm border-t border-border/40 pt-4 mt-5">
                <button className="flex items-center gap-2 hover:text-primary transition-colors group">
                  <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">245</span>
                </button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors group">
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">42</span>
                </button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors group">
                  <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">18</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
