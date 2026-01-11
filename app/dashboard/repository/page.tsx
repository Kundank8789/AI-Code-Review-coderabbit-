"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {ExternalLink,Star,Search} from "lucide-react"
import {useState, useEffect, useRef} from "react"
import { useRepositories } from '@/module/repository/hooks/use-repositories'

interface Repository{
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    language: string | null;
    topics: string[];
    isConnected?: boolean;
}

const RepositoryPage = () => {
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    }=useRepositories();
  return (
    <div className='space-y-4'>
        <div>
            <h1 className='text-3xl font-bold tracking-tight'>Repositories</h1>
            <p className='text-muted-foreground'>Manage and viewall your Github repositories</p>
        </div>
        <div>
            
        </div>
    </div>
  )
}

export default  RepositoryPage