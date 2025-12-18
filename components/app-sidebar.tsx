'use client'
import React from 'react'
import { Github, BookOpen, Settings, Moon, Sun, LogOut, Form } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from '@/components/ui/sidebar'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import Logout from '@/module/auth/components/logout'

export const AppSidebar = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname()
    const { data: session } = useSession()

    useEffect(() => {
        setMounted(true)
    }, [])

    const navigationItems = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: BookOpen,
        },
        {
            title: "Reprository",
            url: "/repository",
            icon: Github,
        },
        {
            title: "Reviews",
            url: "/dashboard/reviews",
            icon: BookOpen,
        },
        {
            title: "Suscriptions",
            url: "/dashboard/suscriptions",
            icon: BookOpen,
        },
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings,
        },
    ]

    const isActive = (url: string) => {
        return pathname === url || pathname.startsWith(url + "/dashboard")
    }
    if (!mounted || !session) return null

    const user = session.user
    const userName = user.name || "Guest"
    const userEmail = user.email || ""
    const userAvatar = user.image || ""

    const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase()


    return (
        <Sidebar>
            <SidebarHeader className='border-b'>
                <div className='flex flex-col gap-4 px-2 py-6'>
                    <div className='flex items-center gap-4 px-3 py-4 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar'>
                        <div className='flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground shrink-0'>
                            <Github className='w-6 h-6' />
                        </div>
                        <div className='flex-1 min-w-0'>
                            <p className='text-xs font-semibold text-sidebar-foreground tracking-wide'>Connected to Account</p>
                            <p className='text-xs font-medium text-sidebar-foreground/90'>@{userName}</p>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className='px-3 py-6 flex-col gap-2'>
                <div className='mb-2'>
                    <p className='text-xs font-semibold text-sidebar-foreground/60 px-3 mb-3 uppercase tracking-widest'>Menu</p>
                </div>
                <SidebarMenu className='gap-2'>
                    {
                        navigationItems.map((item)=>(
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                className={`h-11 px-4 rounded-lg transition-all duration-200 ${isActive(item.url)
                                    ?"bg-sidebar-accent text-sidebar-foreground font-semibold"
                                    :"hover:bg-sidebar-accent/60 text-sidebar-foreground"
                                }`}
                                >
                                    <Link href={item.url} className='flex items-center gap-3'>
                                        <item.icon className='w-6 h-6 shrink-0' />
                                        <span className='text-sm font-medium'>{item.title}</span>
                                    </Link>

                                </SidebarMenuButton>
                                </SidebarMenuItem>
                        ))

                    }
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className='border-t px-3 py-4'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                size="lg"
                                className='h-12 px-4 rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors'
                                >
                                    <Avatar>
                                        <AvatarImage src={userAvatar || "placeholder.svg"} alt={userName}/>
                                        <AvatarFallback className='rounded-lg'>
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='grid flex-1 text-left text-sm leading-relaxed min-w-0'>
                                        <span className='truncate font-semibold text-base'>{userName}</span>
                                        <span className='truncate text-xs text-sidebar-foreground/70'>{userEmail}</span>
                                    </div>

                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}