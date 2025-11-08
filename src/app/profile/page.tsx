import AppLayout from '@/components/app-layout';
import AvatarEditor from '@/components/profile/avatar-editor';
import ThemeSelector from '@/components/profile/theme-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Profile & Settings</h1>
        </div>
        <Tabs defaultValue="avatar">
          <TabsList>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
          </TabsList>
          <TabsContent value="avatar">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <AvatarEditor />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="themes">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <ThemeSelector />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
