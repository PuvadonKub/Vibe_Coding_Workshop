import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  ShoppingBag, 
  MessageCircle,
  Edit,
  Settings
} from "lucide-react";

const Profile = () => {
  const userProfile = {
    name: "Sarah Chen",
    email: "sarah.chen@university.edu", 
    phone: "+1 (555) 123-4567",
    location: "Campus North",
    rating: 4.9,
    totalSales: 23,
    joinDate: "September 2023",
    verified: true,
    bio: "Computer Science major selling textbooks and electronics. Always honest about condition and quick to respond!"
  };

  const activeListings = [
    {
      id: "1",
      title: "Calculus Textbook - 12th Edition",
      price: 85,
      condition: "Like New",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop",
      views: 24,
      saves: 5
    },
    {
      id: "2", 
      title: "iPad Pro 11-inch with Apple Pencil",
      price: 650,
      condition: "Excellent",
      image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=200&h=200&fit=crop",
      views: 42,
      saves: 12
    }
  ];

  const purchaseHistory = [
    {
      id: "1",
      title: "MacBook Air M2 - Excellent Condition", 
      price: 950,
      seller: "Mike Johnson",
      date: "2 weeks ago",
      status: "Completed"
    },
    {
      id: "2",
      title: "Statistics Tutoring - Honor Roll Student",
      price: 25,
      seller: "Alex Rivera", 
      date: "1 month ago",
      status: "Completed"
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop" />
                <AvatarFallback className="text-lg">SC</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{userProfile.name}</h1>
                  {userProfile.verified && (
                    <Badge variant="secondary" className="w-fit">
                      ✓ Verified Student
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-4">{userProfile.bio}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{userProfile.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{userProfile.totalSales} sales</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{userProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Joined {userProfile.joinDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="purchases">Purchase History</TabsTrigger>
            <TabsTrigger value="settings">Account Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Listings ({activeListings.length})</h2>
              <Button variant="marketplace">
                <ShoppingBag className="h-4 w-4" />
                Add New Listing
              </Button>
            </div>
            
            <div className="grid gap-4">
              {activeListings.map((listing) => (
                <Card key={listing.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img 
                        src={listing.image}
                        alt={listing.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{listing.condition}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">${listing.price}</span>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{listing.views} views</span>
                            <span>{listing.saves} saved</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <h2 className="text-xl font-semibold">Purchase History</h2>
            <div className="grid gap-4">
              {purchaseHistory.map((purchase) => (
                <Card key={purchase.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{purchase.title}</h3>
                        <p className="text-sm text-muted-foreground">Seller: {purchase.seller}</p>
                        <p className="text-sm text-muted-foreground">{purchase.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">${purchase.price}</span>
                        <Badge variant="secondary" className="ml-2">{purchase.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userProfile.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={userProfile.phone} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Campus Location</Label>
                  <Input id="location" value={userProfile.location} />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Messages</p>
                    <p className="text-sm text-muted-foreground">Get notified when someone messages you</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Price Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified about price drops on saved items</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;