import { MapPin, Phone } from "lucide-react"

interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
}

interface MenuHeaderProps {
  restaurant: Restaurant
  tableNumber: string
}

export function MenuHeader({ restaurant, tableNumber }: MenuHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            {restaurant.description && <p className="text-gray-600 mt-1 text-sm">{restaurant.description}</p>}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              {restaurant.address && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{restaurant.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Table {tableNumber}
          </div>
        </div>
      </div>
    </div>
  )
}
