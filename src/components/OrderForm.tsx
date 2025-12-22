import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Cake, CreditCard, Truck, User } from "lucide-react";

interface OrderFormData {
  // Customer details
  phone_no: string;
  name: string;
  gst_no: string;
  email: string;
  address: string;
  city: string;
  
  // Cake details
  cake_size: string;
  flavour: string;
  cake_description: string;
  message_on_cake: string;
  cake_color: string;
  
  // Occasion
  occasion_type: string;
  occasion_date: string;
  other_menu: string;
  
  // Delivery
  delivery_date: string;
  delivery_address: string;
  delivery_type: string;
  same_as_customer_address: boolean;
  delivery_city: string;
  delivery_charge: number;
  
  // Pricing
  total_amount: number;
  coupon_code: string;
  discount_percentage: number;
  after_discount: number;
  tax_percentage: number;
  tax_extra_no: string;
  tax_value: number;
  grand_total: number;
  
  // Payment
  cash_payment: number;
  credit_card_payment: number;
  debit_card_payment: number;
  online_payment: number;
  other_payment: number;
  balance: number;
}

const initialFormData: OrderFormData = {
  phone_no: "",
  name: "",
  gst_no: "",
  email: "",
  address: "",
  city: "",
  cake_size: "",
  flavour: "",
  cake_description: "",
  message_on_cake: "",
  cake_color: "",
  occasion_type: "",
  occasion_date: "",
  other_menu: "",
  delivery_date: new Date().toISOString().slice(0, 16),
  delivery_address: "",
  delivery_type: "",
  same_as_customer_address: false,
  delivery_city: "",
  delivery_charge: 0,
  total_amount: 0,
  coupon_code: "",
  discount_percentage: 0,
  after_discount: 0,
  tax_percentage: 5,
  tax_extra_no: "",
  tax_value: 0,
  grand_total: 0,
  cash_payment: 0,
  credit_card_payment: 0,
  debit_card_payment: 0,
  online_payment: 0,
  other_payment: 0,
  balance: 0,
};

const deliveryTypes = ["Pickup", "Home Delivery", "Express Delivery"];
const occasionTypes = ["Birthday", "Wedding", "Anniversary", "Corporate", "Festival", "Other"];
const cakeSizes = ["0.5 kg", "1 kg", "1.5 kg", "2 kg", "3 kg", "5 kg", "Custom"];
const flavours = ["Chocolate", "Vanilla", "Butterscotch", "Red Velvet", "Black Forest", "Pineapple", "Strawberry", "Custom"];

interface OrderFormProps {
  onOrderCreated: () => void;
}

export const OrderForm = ({ onOrderCreated }: OrderFormProps) => {
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSameAddressChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      same_as_customer_address: checked,
      delivery_address: checked ? prev.address : prev.delivery_address,
      delivery_city: checked ? prev.city : prev.delivery_city,
    }));
  };

  // Calculate pricing
  useEffect(() => {
    const subtotal = formData.total_amount + formData.delivery_charge;
    const discountAmount = subtotal * (formData.discount_percentage / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxValue = afterDiscount * (formData.tax_percentage / 100);
    const grandTotal = afterDiscount + taxValue;
    
    const totalPaid = formData.cash_payment + formData.credit_card_payment + 
                      formData.debit_card_payment + formData.online_payment + 
                      formData.other_payment;
    const balance = grandTotal - totalPaid;

    setFormData(prev => ({
      ...prev,
      after_discount: afterDiscount,
      tax_value: taxValue,
      grand_total: grandTotal,
      balance: balance,
    }));
  }, [
    formData.total_amount,
    formData.delivery_charge,
    formData.discount_percentage,
    formData.tax_percentage,
    formData.cash_payment,
    formData.credit_card_payment,
    formData.debit_card_payment,
    formData.online_payment,
    formData.other_payment,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, create or find customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone_no", formData.phone_no)
        .maybeSingle();

      let customerId: string;

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer info
        await supabase
          .from("customers")
          .update({
            name: formData.name,
            gst_no: formData.gst_no || null,
            email: formData.email || null,
            address: formData.address || null,
            city: formData.city || null,
          })
          .eq("id", customerId);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            phone_no: formData.phone_no,
            name: formData.name,
            gst_no: formData.gst_no || null,
            email: formData.email || null,
            address: formData.address || null,
            city: formData.city || null,
          })
          .select("id")
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Create order
      const { error: orderError } = await supabase.from("orders").insert([{
        customer_id: customerId,
        order_number: `ORD-${Date.now()}`,
        cake_size: formData.cake_size || null,
        flavour: formData.flavour || null,
        cake_description: formData.cake_description || null,
        message_on_cake: formData.message_on_cake || null,
        cake_color: formData.cake_color || null,
        occasion_type: formData.occasion_type || null,
        occasion_date: formData.occasion_date || null,
        other_menu: formData.other_menu || null,
        delivery_date: formData.delivery_date || null,
        delivery_address: formData.delivery_address || null,
        delivery_type: formData.delivery_type || null,
        same_as_customer_address: formData.same_as_customer_address,
        delivery_city: formData.delivery_city || null,
        delivery_charge: formData.delivery_charge,
        total_amount: formData.total_amount,
        coupon_code: formData.coupon_code || null,
        discount_percentage: formData.discount_percentage,
        after_discount: formData.after_discount,
        tax_percentage: formData.tax_percentage,
        tax_extra_no: formData.tax_extra_no || null,
        tax_value: formData.tax_value,
        grand_total: formData.grand_total,
        cash_payment: formData.cash_payment,
        credit_card_payment: formData.credit_card_payment,
        debit_card_payment: formData.debit_card_payment,
        online_payment: formData.online_payment,
        other_payment: formData.other_payment,
        balance: formData.balance,
      }]);

      if (orderError) throw orderError;

      toast.success("Order created successfully!");
      setFormData(initialFormData);
      onOrderCreated();
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Cake Details */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-gold font-display text-xl">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormField
                label="Phone No"
                name="phone_no"
                value={formData.phone_no}
                onChange={handleInputChange}
                required
              />
              <FormField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <FormField
                label="Customer GST No"
                name="gst_no"
                value={formData.gst_no}
                onChange={handleInputChange}
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <FormField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                textarea
              />
              <FormField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-gold font-display text-xl">
                <Cake className="h-5 w-5" />
                Cake Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-gold-light text-sm font-medium">Cake Size</Label>
                <Select value={formData.cake_size} onValueChange={(v) => handleSelectChange("cake_size", v)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {cakeSizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gold-light text-sm font-medium">Flavour</Label>
                <Select value={formData.flavour} onValueChange={(v) => handleSelectChange("flavour", v)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select flavour" />
                  </SelectTrigger>
                  <SelectContent>
                    {flavours.map(flavour => (
                      <SelectItem key={flavour} value={flavour}>{flavour}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormField
                label="Cake Description"
                name="cake_description"
                value={formData.cake_description}
                onChange={handleInputChange}
                textarea
              />
              <FormField
                label="Message on Cake"
                name="message_on_cake"
                value={formData.message_on_cake}
                onChange={handleInputChange}
              />
              <FormField
                label="Cake Color"
                name="cake_color"
                value={formData.cake_color}
                onChange={handleInputChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Delivery & Occasion */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-gold font-display text-xl">
                <Truck className="h-5 w-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormField
                label="Delivery Date"
                name="delivery_date"
                type="datetime-local"
                value={formData.delivery_date}
                onChange={handleInputChange}
              />
              <div className="space-y-2">
                <Label className="text-gold-light text-sm font-medium">Delivery Type</Label>
                <Select value={formData.delivery_type} onValueChange={(v) => handleSelectChange("delivery_type", v)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="same_address"
                  checked={formData.same_as_customer_address}
                  onCheckedChange={handleSameAddressChange}
                  className="border-gold data-[state=checked]:bg-gold data-[state=checked]:text-background"
                />
                <Label htmlFor="same_address" className="text-muted-foreground text-sm">
                  Same as Customer Address
                </Label>
              </div>
              <FormField
                label="Delivery Address"
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleInputChange}
                textarea
              />
              <FormField
                label="Delivery City"
                name="delivery_city"
                value={formData.delivery_city}
                onChange={handleInputChange}
              />
              <FormField
                label="Delivery Charge"
                name="delivery_charge"
                type="number"
                value={formData.delivery_charge}
                onChange={handleNumberChange}
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-gold font-display text-xl">
                <Calendar className="h-5 w-5" />
                Occasion Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-gold-light text-sm font-medium">Occasion Type</Label>
                <Select value={formData.occasion_type} onValueChange={(v) => handleSelectChange("occasion_type", v)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasionTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormField
                label="Occasion Date"
                name="occasion_date"
                type="date"
                value={formData.occasion_date}
                onChange={handleInputChange}
              />
              <FormField
                label="Other Menu Items"
                name="other_menu"
                value={formData.other_menu}
                onChange={handleInputChange}
                textarea
              />
            </CardContent>
          </Card>
        </div>

        {/* Pricing & Payment */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-gold font-display text-xl">
                <CreditCard className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormField
                label="Total Amount"
                name="total_amount"
                type="number"
                value={formData.total_amount}
                onChange={handleNumberChange}
              />
              <div className="flex gap-2">
                <FormField
                  label="Coupon Code"
                  name="coupon_code"
                  value={formData.coupon_code}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                <Button type="button" variant="outline" className="mt-auto border-gold text-gold hover:bg-gold/10">
                  Apply
                </Button>
              </div>
              <FormField
                label="Discount (%)"
                name="discount_percentage"
                type="number"
                value={formData.discount_percentage}
                onChange={handleNumberChange}
              />
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After Discount</span>
                  <span className="text-foreground">₹{formData.after_discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({formData.tax_percentage}%)</span>
                  <span className="text-foreground">₹{formData.tax_value.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span className="text-gold">Grand Total</span>
                  <span className="text-gold text-lg">₹{formData.grand_total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-gold font-display text-xl">
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormField
                label="Cash"
                name="cash_payment"
                type="number"
                value={formData.cash_payment}
                onChange={handleNumberChange}
              />
              <FormField
                label="Credit Card"
                name="credit_card_payment"
                type="number"
                value={formData.credit_card_payment}
                onChange={handleNumberChange}
              />
              <FormField
                label="Debit Card"
                name="debit_card_payment"
                type="number"
                value={formData.debit_card_payment}
                onChange={handleNumberChange}
              />
              <FormField
                label="Online"
                name="online_payment"
                type="number"
                value={formData.online_payment}
                onChange={handleNumberChange}
              />
              <FormField
                label="Other"
                name="other_payment"
                type="number"
                value={formData.other_payment}
                onChange={handleNumberChange}
              />
              <div className="bg-maroon/20 rounded-lg p-3">
                <div className="flex justify-between font-semibold">
                  <span className="text-maroon-light">Balance Due</span>
                  <span className={`text-lg ${formData.balance > 0 ? "text-maroon-light" : "text-green-500"}`}>
                    ₹{formData.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gold hover:bg-gold-dark text-background font-semibold py-6 text-lg shadow-gold transition-all duration-300"
          >
            {isSubmitting ? "Creating Order..." : "Create Order"}
          </Button>
        </div>
      </div>
    </form>
  );
};
