'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Mail, MapPin, Briefcase, Link as LinkIcon, Edit2 } from 'lucide-react';

export default function ProfilePage() {
  return (
    <DashboardLayout className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              <Avatar size="xl" initials="JD" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">John Doe</h1>
                    <p className="text-foreground-secondary">Senior Product Designer</p>
                  </div>
                  <Button variant="outline" size="md" className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <MapPin className="w-4 h-4" />
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <Briefcase className="w-4 h-4" />
                    <span>at Design Systems Inc.</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <Mail className="w-4 h-4" />
                    <span>john@example.com</span>
                  </div>
                </div>

                <p className="mt-4 text-foreground">
                  Passionate about creating beautiful and intuitive user experiences. Love coffee,
                  design systems, and building things that matter.
                </p>

                <div className="flex gap-4 mt-4">
                  <div>
                    <p className="font-bold text-lg text-foreground">2.5K</p>
                    <p className="text-sm text-foreground-secondary">Followers</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-foreground">500</p>
                    <p className="text-sm text-foreground-secondary">Following</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-foreground">45</p>
                    <p className="text-sm text-foreground-secondary">Posts</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground-secondary mb-1">Headline</p>
              <p className="text-foreground">Senior Product Designer at Design Systems Inc.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground-secondary mb-1">Current Position</p>
              <p className="text-foreground">Senior Product Designer</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground-secondary mb-1">Education</p>
              <p className="text-foreground">Bachelor of Fine Arts in Graphic Design</p>
              <p className="text-sm text-foreground-secondary">California Institute of the Arts, 2016</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground-secondary mb-1">Website</p>
              <a href="#" className="text-primary hover:underline flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                johndoe.design
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Experience Section */}
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2].map((idx) => (
              <div key={idx} className="pb-6 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded bg-primary text-white flex items-center justify-center font-bold">
                    DS
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Senior Product Designer</h3>
                    <p className="text-sm text-foreground-secondary">Design Systems Inc.</p>
                    <p className="text-xs text-foreground-secondary mt-1">Jan 2022 - Present</p>
                    <p className="text-foreground mt-2 text-sm">
                      Leading design system initiatives and mentoring junior designers on best practices.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
