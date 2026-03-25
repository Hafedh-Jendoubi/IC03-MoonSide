'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Plus, MessageSquare } from 'lucide-react';

const groups = [
  {
    id: 1,
    name: 'Design Systems Community',
    description: 'A place for designers to discuss design systems, component libraries, and best practices.',
    members: 3250,
    isMember: true,
    avatar: 'DS',
  },
  {
    id: 2,
    name: 'Product Managers Network',
    description: 'Connect with product managers from around the world. Share insights and discuss product strategy.',
    members: 5680,
    isMember: true,
    avatar: 'PM',
  },
  {
    id: 3,
    name: 'Startup Founders',
    description: 'For founders and entrepreneurs building the next generation of products.',
    members: 8932,
    isMember: false,
    avatar: 'SF',
  },
  {
    id: 4,
    name: 'Digital Marketing Professionals',
    description: 'Share strategies, tools, and best practices for digital marketing campaigns.',
    members: 12500,
    isMember: false,
    avatar: 'DM',
  },
];

export default function GroupsPage() {
  return (
    <DashboardLayout className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Groups</h1>
            <p className="text-foreground-secondary mt-1">Join communities and connect with professionals</p>
          </div>
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-6">
          <button className="px-4 py-3 text-foreground font-medium border-b-2 border-primary">
            Your Groups
          </button>
          <button className="px-4 py-3 text-foreground-secondary hover:text-foreground transition-colors">
            Discover
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.id} hoverable>
              <CardContent className="p-6">
                <div className="flex gap-4 md:gap-6">
                  <Avatar size="lg" initials={group.avatar} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
                    <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-foreground-secondary">
                      <Users className="w-4 h-4" />
                      <span>{group.members.toLocaleString()} members</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    {group.isMember ? (
                      <>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">Message</span>
                        </Button>
                        <Button variant="outline" size="sm">
                          Leave
                        </Button>
                      </>
                    ) : (
                      <Button variant="primary" size="sm">
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
