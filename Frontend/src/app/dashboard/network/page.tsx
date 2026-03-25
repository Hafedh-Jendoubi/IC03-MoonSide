'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { UserPlus, Mail, MoreHorizontal } from 'lucide-react';

const connections = [
  {
    id: 1,
    name: 'Sarah Johnson',
    title: 'UX/UI Designer',
    company: 'Tech Innovations Inc.',
    isConnected: true,
  },
  {
    id: 2,
    name: 'Michael Chen',
    title: 'Product Manager',
    company: 'Global Solutions Ltd.',
    isConnected: false,
  },
  {
    id: 3,
    name: 'Emma Williams',
    title: 'Full Stack Developer',
    company: 'StartUp Co.',
    isConnected: true,
  },
  {
    id: 4,
    name: 'David Martinez',
    title: 'Data Scientist',
    company: 'Analytics Hub',
    isConnected: false,
  },
];

export default function NetworkPage() {
  return (
    <DashboardLayout className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Network</h1>
          <p className="text-foreground-secondary mt-1">Manage your professional connections</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Connections', value: '1,250' },
            { label: 'Followers', value: '2,500' },
            { label: 'Following', value: '450' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-foreground-secondary">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connections List */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Your Connections</h2>
          <div className="grid gap-4">
            {connections.map((person) => (
              <Card key={person.id} hoverable>
                <CardContent className="p-6">
                  <div className="flex gap-4 md:gap-6 items-start md:items-center">
                    <Avatar size="md" initials={person.name.split(' ').map(n => n[0]).join('')} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{person.name}</h3>
                      <p className="text-sm text-foreground-secondary">{person.title}</p>
                      <p className="text-xs text-foreground-secondary mt-1">{person.company}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {person.isConnected ? (
                        <>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="hidden sm:inline">Message</span>
                          </Button>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="primary" size="sm" className="gap-2">
                          <UserPlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Connect</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
