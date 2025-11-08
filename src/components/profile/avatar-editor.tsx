'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const hats = [
  { id: 'swag-hat-1', name: 'Top Hat' },
  { id: 'swag-hat-2', name: 'Cap' },
];

const glasses = [
  { id: 'swag-glasses-1', name: 'Sunglasses' },
  { id: 'swag-glasses-2', name: 'Spectacles' },
];

const propsItem = [
  { id: 'swag-prop-1', name: 'Sword' },
];


export default function AvatarEditor() {
  const [selectedHat, setSelectedHat] = useState<string | null>(null);
  const [selectedGlasses, setSelectedGlasses] = useState<string | null>(null);
  const [selectedProp, setSelectedProp] = useState<string | null>(null);

  const avatarBase = PlaceHolderImages.find((p) => p.id === 'avatar-base');
  const hatImage = PlaceHolderImages.find((p) => p.id === selectedHat);
  const glassesImage = PlaceHolderImages.find((p) => p.id === selectedGlasses);
  const propImage = PlaceHolderImages.find((p) => p.id === selectedProp);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold mb-4 font-headline">Your Avatar</h2>
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-square w-full">
              {avatarBase && (
                <Image
                  src={avatarBase.imageUrl}
                  alt="Avatar base"
                  fill
                  data-ai-hint={avatarBase.imageHint}
                  className="object-cover rounded-md"
                />
              )}
               {propImage && (
                <Image
                  src={propImage.imageUrl}
                  alt={propImage.description}
                  fill
                  data-ai-hint={propImage.imageHint}
                  className="object-contain"
                  style={{ transform: 'rotate(-15deg) translate(20%, -10%)' }}
                />
              )}
              {hatImage && (
                <Image
                  src={hatImage.imageUrl}
                  alt={hatImage.description}
                  fill
                  data-ai-hint={hatImage.imageHint}
                  className="object-contain"
                   style={{ transform: 'scale(0.6) translateY(-45%)' }}
                />
              )}
              {glassesImage && (
                <Image
                  src={glassesImage.imageUrl}
                  alt={glassesImage.description}
                  fill
                  data-ai-hint={glassesImage.imageHint}
                  className="object-contain"
                  style={{ transform: 'scale(0.5) translateY(10%)' }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-4 font-headline">Customize</h2>
        <Tabs defaultValue="hats" className="w-full">
          <TabsList>
            <TabsTrigger value="hats">Hats</TabsTrigger>
            <TabsTrigger value="glasses">Glasses</TabsTrigger>
            <TabsTrigger value="props">Props</TabsTrigger>
          </TabsList>
          <TabsContent value="hats">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Button variant={selectedHat === null ? 'default' : 'outline'} onClick={() => setSelectedHat(null)}>None</Button>
              {hats.map((item) => {
                const image = PlaceHolderImages.find((p) => p.id === item.id);
                return (
                  <Button key={item.id} variant={selectedHat === item.id ? 'default' : 'outline'} onClick={() => setSelectedHat(item.id)} className="h-auto flex-col p-2">
                     {image && <Image src={image.imageUrl} alt={item.name} width={80} height={80} className="mb-2" />}
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </TabsContent>
           <TabsContent value="glasses">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Button variant={selectedGlasses === null ? 'default' : 'outline'} onClick={() => setSelectedGlasses(null)}>None</Button>
              {glasses.map((item) => {
                const image = PlaceHolderImages.find((p) => p.id === item.id);
                return (
                  <Button key={item.id} variant={selectedGlasses === item.id ? 'default' : 'outline'} onClick={() => setSelectedGlasses(item.id)} className="h-auto flex-col p-2">
                     {image && <Image src={image.imageUrl} alt={item.name} width={80} height={40} className="mb-2" />}
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="props">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Button variant={selectedProp === null ? 'default' : 'outline'} onClick={() => setSelectedProp(null)}>None</Button>
              {propsItem.map((item) => {
                const image = PlaceHolderImages.find((p) => p.id === item.id);
                return (
                  <Button key={item.id} variant={selectedProp === item.id ? 'default' : 'outline'} onClick={() => setSelectedProp(item.id)} className="h-auto flex-col p-2">
                     {image && <Image src={image.imageUrl} alt={item.name} width={80} height={80} className="mb-2" />}
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
