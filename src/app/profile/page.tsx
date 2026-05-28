import AppLayout from '@/components/app-layout';
import AudioSettings from '@/components/profile/audio-settings';
import AppearanceEditor from '@/components/profile/appearance-editor';
import ProfilePictureEditor from '@/components/profile/profile-picture-editor';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Profile & Settings</h1>
        </div>
        <Tabs defaultValue="picture">
          <TabsList>
            <TabsTrigger value="picture">Picture</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          <TabsContent value="picture">
            <ProfilePictureEditor />
          </TabsContent>
          <TabsContent value="appearance">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <AppearanceEditor />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="audio">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <AudioSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
