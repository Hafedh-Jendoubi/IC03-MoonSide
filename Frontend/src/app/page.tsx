'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Users, Sparkles, Globe, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
              C
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline tracking-tight">Connect</span>
          </Link>
          <div className="flex gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground-secondary">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary-dark text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Professional Network for Modern Teams</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-8 text-balance leading-tight">
            Connect & Grow Your Professional Network
          </h1>
          <p className="text-xl text-foreground-secondary mb-12 max-w-2xl mx-auto text-pretty font-light leading-relaxed">
            Build meaningful relationships with industry leaders. Share expertise, discover opportunities, and advance your career with a global community of professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white gap-2 group">
                Start Your Journey
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-border/80 hover:border-border">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Powerful tools and features designed to help professionals thrive in today's connected world.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: 'Smart Networking',
                description: 'Connect with vetted professionals and expand your industry influence.',
              },
              {
                icon: Sparkles,
                title: 'Opportunities Abound',
                description: 'Discover job offers, projects, and partnerships tailored to your goals.',
              },
              {
                icon: Globe,
                title: 'Global Community',
                description: 'Access a worldwide network of 250K+ professionals across industries.',
              },
              {
                icon: TrendingUp,
                title: 'Career Growth',
                description: 'Track skills development and unlock new career milestones.',
              },
            ].map((feature, idx) => (
              <Card key={idx} className="group border-border/40 hover:border-border/80 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <feature.icon className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-foreground mb-3 text-lg">{feature.title}</h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 border-t border-border/40 bg-background-secondary/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { value: '250K+', label: 'Active Professionals' },
              { value: '5K+', label: 'Verified Companies' },
              { value: '150+', label: 'Countries' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-5xl lg:text-6xl font-bold text-primary">{stat.value}</p>
                <p className="text-foreground-secondary font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Loved by Professionals Worldwide</h2>
            <p className="text-lg text-foreground-secondary">See what people are saying about their experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'This platform transformed how I network. Found my dream job within 3 months.',
                author: 'Sarah Chen',
                role: 'Product Manager',
              },
              {
                quote: 'The quality of connections here is unmatched. Real professionals, real opportunities.',
                author: 'Marcus Johnson',
                role: 'Tech Lead',
              },
              {
                quote: 'Finally found a community where I can grow and contribute meaningfully.',
                author: 'Elena Rodriguez',
                role: 'UX Designer',
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="border-border/40">
                <CardContent className="p-8">
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-primary rounded-full" />
                    ))}
                  </div>
                  <p className="text-foreground-secondary mb-6 italic text-sm leading-relaxed">"{testimonial.quote}"</p>
                  <div className="border-t border-border/40 pt-4">
                    <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                    <p className="text-foreground-secondary text-xs">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border/40 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-foreground-secondary mb-12 text-pretty">
            Join thousands of professionals building meaningful connections and advancing together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white">
                Create Free Account
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-16 bg-background-secondary/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Community</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#" className="hover:text-foreground transition-colors">Groups</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Events</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-foreground-secondary">
                &copy; 2025 Connect. All rights reserved.
              </p>
              <div className="flex gap-4 text-foreground-secondary">
                <a href="#" className="hover:text-foreground transition-colors text-sm">Twitter</a>
                <a href="#" className="hover:text-foreground transition-colors text-sm">LinkedIn</a>
                <a href="#" className="hover:text-foreground transition-colors text-sm">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
