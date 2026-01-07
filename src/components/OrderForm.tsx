import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/FormField";
import { billReceiptHTML, detailSlipHTML } from "@/lib/receiptTemplate";
import { printHtml } from "@/lib/print";
import { useEffectiveOutlet } from "@/lib/useEffectiveOutlet";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Cake, CreditCard, Truck, User } from "lucide-react";
import { useAppSettings } from "../lib/useAppSettings";
import { useAdminOutlet } from "@/context/AdminOutletContext"
import { create } from "node:domain";


/* ================= TYPES ================= */

interface OrderFormData {
  phone_no: string;
  name: string;
  gst_no: string;
  email: string;
  address: string;
  city: string;

  cake_size: string;
  flavour: string;
  cake_description: string;
  message_on_cake: string;
  cake_color: string;

  occasion_type: string;
  occasion_date: string;
  other_menu: string;

  delivery_date: string;
  delivery_address: string;
  delivery_type: string;
  same_as_customer_address: boolean;
  delivery_city: string;
  delivery_charge: string;

  total_amount: string;
  coupon_code: string;
  discount_percentage: string;

  after_discount: number;
  tax_percentage: number;
  tax_value: number;
  grand_total: number;

  cash_payment: string;
  credit_card_payment: string;
  online_payment: string;
  free_bill: string;
  balance: number;
}

/* ================= INITIAL STATE ================= */

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
  delivery_charge: "",

  total_amount: "",
  coupon_code: "",
  discount_percentage: "",

  after_discount: 0,
  tax_percentage: 0,
  tax_value: 0,
  grand_total: 0,

  cash_payment: "",
  credit_card_payment: "",
  online_payment: "",
  free_bill: "",
  balance: 0,
};

/* ================= CONSTANTS ================= */

const deliveryTypes = ["Pickup", "Home Delivery", "Express Delivery"];
const occasionTypes = [
  "Birthday",
  "Wedding",
  "Anniversary",
  "Corporate",
  "Festival",
  "Other",
];

const flavours = [
  "Chocolate",
  "Vanilla",
  "Butterscotch",
  "Red Velvet",
  "Black Forest",
  "Pineapple",
  "Strawberry",
  "Blueberry",
];

interface OrderFormProps {
  onOrderCreated?: () => void;
}



/* ================= COMPONENT ================= */

export const OrderForm = ({ onOrderCreated }: OrderFormProps) => {
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cakeImage, setCakeImage] = useState<File | null>(null);
  const [cakeImagePreview, setCakeImagePreview] = useState<string | null>(null);
  const { outletId, loading: outletLoading } = useEffectiveOutlet();
  const { settings, loading: gstLoading } = useAppSettings(outletId);



  const { selectedOutlet } = useAdminOutlet();
  
  /* ---------- PRINT HANDLERS ---------- */
  
  const handlePrintBill = (order: any) => {
    if (!selectedOutlet) {
      toast.error("Outlet not selected");
      return;
    }

    printHtml(
      billReceiptHTML({
        ...order,
        outlet: selectedOutlet,
      })
    );
  };

  const handlePrintSlip = (order: any) => {
    if (!selectedOutlet) {
      toast.error("Outlet not selected");
      return;
    }

    printHtml(
      detailSlipHTML({
        ...order,
        outlet: selectedOutlet,
      })
    );
  };

  /* ---------- INPUT HANDLERS ---------- */

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!/^[0-9]*\.?[0-9]*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSameAddressChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      same_as_customer_address: checked,
      delivery_address: checked ? prev.address : prev.delivery_address,
      delivery_city: checked ? prev.city : prev.delivery_city,
    }));
  };

  /* ---------- CALCULATIONS ---------- */

  useEffect(() => {
    const total = Number(formData.total_amount) || 0;
    const delivery = Number(formData.delivery_charge) || 0;
    const discountPercent = Number(formData.discount_percentage) || 0;

    const subtotal = total + delivery;
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;

    let taxPercent = 0;
    if (settings?.gst_enabled) {
      taxPercent = settings.gst_percentage;
    }

    const taxValue = afterDiscount * (formData.tax_percentage / 100);
    const grandTotal = afterDiscount + taxValue;

    const totalPaid =
      Number(formData.cash_payment || 0) +
      Number(formData.credit_card_payment || 0) +
      Number(formData.online_payment || 0) +
      Number(formData.free_bill || 0);

    setFormData((prev) => ({
      ...prev,
      tax_percentage: taxPercent,
      after_discount: afterDiscount,
      tax_value: taxValue,
      grand_total: grandTotal,
      balance: grandTotal - totalPaid,
    }));
  }, [
    formData.total_amount,
    formData.delivery_charge,
    formData.discount_percentage,
    formData.cash_payment,
    formData.credit_card_payment,
    formData.online_payment,
    formData.free_bill,
    settings,
  ]);


  
  /* ---------- VALIDATION ---------- */

  const validateForm = () => {
    if (!formData.phone_no.trim())
      return toast.error("Phone number is required"), false;
    if (!formData.name.trim())
      return toast.error("Customer name is required"), false;
    if (Number(formData.total_amount) <= 0)
      return toast.error("Total amount must be greater than 0"), false;
    return true;
  };

  /* ---------- SUBMIT ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

  //  validation
    if (!validateForm()) return;

    const { data: auth } = await supabase.auth.getUser();

    // Auth check

    if (!auth.user) {
      toast.error("You must be logged in to upload images");
      setIsSubmitting(false);
      return;
    }

    // cake
      let cakePhotoUrl: string | null = null;

    if (cakeImage) {
      const fileExt = cakeImage.name.split(".").pop();
      const fileName = `cake-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("cake-images")
        .upload(fileName, cakeImage);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("cake-images")
        .getPublicUrl(fileName);

      cakePhotoUrl = data.publicUrl;
    }

    // Outlet check

    if(!outletId){
      toast.error("Please select an outlet before creating an order");
      return;
    }
    setIsSubmitting(true);

    try{
      const {data: existingCustomer}= await supabase
      .from("customers")
      .select("id")
      .eq("phone_no", formData.phone_no)
      .maybeSingle();

      let customerId: string;
      if(existingCustomer){
        customerId= existingCustomer.id;
      }else{
        const {data: newCustomer, error}= await supabase
        .from("customers")
        .insert({
          phone_no: formData.phone_no,
          name: formData.name,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          gst_no: formData.gst_no || null,
          outlet_id: outletId,
        })
        .select("id")
        .single();
        if(error) throw error;
        customerId= newCustomer.id;
    }

    // ------ Insert Order ------
    const {data:createdOrder,error}= await supabase
    .from("orders")
    
    .insert({ 
      outlet_id: outletId,
      order_number: `ORD-${Date.now()}`,
      customer_id: customerId,
      cake_size: formData.cake_size || null,
      flavour: formData.flavour || null,
      cake_description: formData.cake_description || null,
      message_on_cake: formData.message_on_cake || null,
      cake_color: formData.cake_color || null,
      cake_photo_url: null,
      occasion_type: formData.occasion_type || null,
      occasion_date: formData.occasion_date || null,
      other_menu: formData.other_menu || null,
      delivery_date: formData.delivery_date,
      delivery_address: formData.delivery_address || null,
      delivery_city: formData.delivery_city || null,
      delivery_charge: Number(formData.delivery_charge),
      delivery_type: formData.delivery_type || null,
      total_amount: Number(formData.total_amount),
      tax_percentage: formData.tax_percentage,
      tax_value: formData.tax_value,
      discount_percentage: Number(formData.discount_percentage),
      after_discount: formData.after_discount,
      grand_total: formData.grand_total,
      cash_payment: Number(formData.cash_payment),
      credit_card_payment: Number(formData.credit_card_payment),
      online_payment: Number(formData.online_payment),
      free_bill: Number(formData.free_bill),
      balance: formData.balance,
      status: "pending",
    })
    .select("*, customers(*)")
    .single();
    if(error) throw error;

    // ------ Print Receipts ------
    handlePrintBill(createdOrder);
    handlePrintSlip(createdOrder);

    toast.success("Order created successfully and printed");
    setFormData(initialFormData);
    onOrderCreated?.();
  }
    catch(err:any){
      toast.error(err.message || "Failed to create order");
    }
    finally
    {
      setIsSubmitting(false);
    }
  };
   
  



  return (
    <>
    {outletLoading && (
      <div className="p-6 text-muted-foreground">
        Loading outlet...
      </div>
    )}
    {!outletLoading && !outletId &&(
      <div className="p-6 text-red-500">
        Outlet not assigned. Please contact admin.
      </div>
    )
    }
    {!outletLoading && outletId && (
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
                required
              />
              <FormField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
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
                <FormField
                  label="Cake Size"
                  name="cake_size"
                  value={formData.cake_size}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gold-light text-sm font-medium">
                  Flavour
                </Label>
                <Select
                  value={formData.flavour}
                  onValueChange={(v) => handleSelectChange("flavour", v)}
                  required
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select flavour" />
                  </SelectTrigger>
                  <SelectContent>
                    {flavours.map((flavour) => (
                      <SelectItem key={flavour} value={flavour}>
                        {flavour}
                      </SelectItem>
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
                required
              />
              <FormField
                label="Message on Cake"
                name="message_on_cake"
                value={formData.message_on_cake}
                onChange={handleInputChange}
                required
              />
              <FormField
                label="Cake Color"
                name="cake_color"
                value={formData.cake_color}
                onChange={handleInputChange}
                required
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
                required
              />
             

              <div className="space-y-2">
                <Label className="text-gold-light text-sm font-medium">
                  Delivery Type
                </Label>
                <Select
                  value={formData.delivery_type}
                  onValueChange={(v) => handleSelectChange("delivery_type", v)}
                  required
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
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
                <Label
                  htmlFor="same_address"
                  className="text-muted-foreground text-sm"
                >
                  Same as Customer Address
                </Label>
              </div>
              <FormField
                label="Delivery Address"
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleInputChange}
                textarea
                required
              />
              <FormField
                label="Delivery City"
                name="delivery_city"
                value={formData.delivery_city}
                onChange={handleInputChange}
                required
              />
              <FormField
                label="Delivery Charge"
                name="delivery_charge"
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
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
                <Label className="text-gold-light text-sm font-medium">
                  Occasion Type
                </Label>
                <Select
                  value={formData.occasion_type}
                  onValueChange={(v) => handleSelectChange("occasion_type", v)}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
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
                required
              />
              <FormField
                label="Other Menu Items"
                name="other_menu"
                value={formData.other_menu}
                onChange={handleInputChange}
                textarea
              />
              <div className="space-y-3">
                <Label className="text-gold-light text-sm font-medium">
                  Cake Image
                </Label>

                {/* If no image selected */}
                {!cakeImagePreview && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setCakeImage(file);
                      setCakeImagePreview(URL.createObjectURL(file));
                    }}
                  />
                )}

                {/* Preview */}
                {cakeImagePreview && (
                  <div className="space-y-3">
                    <img
                      src={cakeImagePreview}
                      alt="Cake Preview"
                      className="h-40 w-40 object-cover rounded-md border"
                    />

                    <div className="flex gap-2">
                      {/* Change */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("cake-image-input")?.click()
                        }
                      >
                        Change Image
                      </Button>

                      {/* Remove */}
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setCakeImage(null);
                          setCakeImagePreview(null);
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  </div>
                )}

                {/* Hidden input for change */}
                <input
                  id="cake-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setCakeImage(file);
                    setCakeImagePreview(URL.createObjectURL(file));
                  }}
                />
              </div>
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
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={formData.total_amount}
                onChange={handleNumberChange}
                required
              />

              <div className="flex gap-2">
                <FormField
                  label="Coupon Code"
                  name="coupon_code"
                  value={formData.coupon_code}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-auto border-gold text-gold hover:bg-gold/10"
                >
                  Apply
                </Button>
              </div>
              <FormField
                label="Discount (%)"
                name="discount_percentage"
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={formData.discount_percentage}
                onChange={handleNumberChange}
              />
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After Discount</span>
                  <span className="text-foreground">
                    ₹{formData.after_discount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  {/* <span className="text-muted-foreground">
                    Tax ({formData.tax_percentage}%)
                  </span> */}
                  {settings?.gst_enabled ? (
                    <p className="text-sm text-muted-foreground">
                      GST Applied: {settings.gst_percentage}%
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      GST Disabled
                    </p>
                  )}

                  <span className="text-foreground">
                    ₹{formData.tax_value.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span className="text-gold">Grand Total</span>
                  <span className="text-gold text-lg">
                    ₹{formData.grand_total.toFixed(2)}
                  </span>
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
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={formData.cash_payment}
                onChange={handleNumberChange}
              />
              <FormField
                label="Credit Card"
                name="credit_card_payment"
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={formData.credit_card_payment}
                onChange={handleNumberChange}
              />

              <FormField
                label="Online"
                name="online_payment"
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={formData.online_payment}
                onChange={handleNumberChange}
              />
              <FormField
                label="Free Bill"
                name="free_bill"
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={formData.free_bill}
                onChange={handleNumberChange}
              />
              <div className="bg-maroon/20 rounded-lg p-3">
                <div className="flex justify-between font-semibold">
                  <span className="text-maroon-light">Balance Due</span>
                  <span
                    className={`text-lg ${
                      formData.balance > 0
                        ? "text-maroon-light"
                        : "text-green-500"
                    }`}
                  >
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
    )}
    </>
  );
};
