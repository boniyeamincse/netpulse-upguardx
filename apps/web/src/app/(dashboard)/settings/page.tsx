'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Building2,
    Users,
    Key,
    Bell,
    Shield,
    Plus,
    Copy,
    Trash2
} from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your organization and account preferences.</p>
            </div>

            <Tabs defaultValue="org" className="space-y-4">
                <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                    <TabsTrigger value="org" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Organization
                    </TabsTrigger>
                    <TabsTrigger value="members" className="gap-2">
                        <Users className="h-4 w-4" />
                        Members
                    </TabsTrigger>
                    <TabsTrigger value="api" className="gap-2">
                        <Key className="h-4 w-4" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="org" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>Update your organization identity and billing email.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input id="name" defaultValue="Acme Corp" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug Identifier</Label>
                                <div className="flex gap-2">
                                    <span className="flex items-center px-3 rounded-md bg-slate-100 dark:bg-slate-800 text-sm text-muted-foreground border">
                                        netpulse.io/
                                    </span>
                                    <Input id="slug" defaultValue="acme-corp" readOnly className="flex-1" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white ml-auto">Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>Manage who has access to this organization.</CardDescription>
                            </div>
                            <Button gap-2 size="sm">
                                <Plus className="h-4 w-4" />
                                Invite Member
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: 'Boni Yeamin', email: 'boni@netpulse.io', role: 'Owner' },
                                    { name: 'Sarah Chen', email: 'sarah@netpulse.io', role: 'Admin' },
                                    { name: 'Mike Ross', email: 'mike@netpulse.io', role: 'Viewer' },
                                ].map((member, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-emerald-600">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold">{member.name}</div>
                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline">{member.role}</Badge>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>API Keys</CardTitle>
                                <CardDescription>Authentication tokens for CI/CD and custom integrations.</CardDescription>
                            </div>
                            <Button gap-2 size="sm">
                                <Plus className="h-4 w-4" />
                                New API Key
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: 'Production Monitor', key: 'np_live_********************', lastUsed: '2 hours ago' },
                                    { name: 'GitHub Actions', key: 'np_live_********************', lastUsed: '5 days ago' },
                                ].map((key, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                                        <div className="space-y-1">
                                            <div className="text-sm font-bold">{key.name}</div>
                                            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                                                {key.key}
                                                <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-[10px] text-muted-foreground">Last used {key.lastUsed}</div>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>Notification Channels</CardTitle>
                            <CardDescription>Coming soon: Slack, Discord, and PagerDuty integration.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                            Phase 61-65: Alerting & Integrations
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
