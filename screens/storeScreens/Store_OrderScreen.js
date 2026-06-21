import React, {useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  useGetOrders,
  useGetCustomerOrdersbyStoreId,
} from '../../ReactQuery/TanStackQueryHooks/storee/useOrder';
import {StoreOwnerContext} from '../../context/IsStoreOwner';
import {OwnerContext} from '../../context/IsOwner';
import {useNavigation} from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const formatDate = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const shortId = id => (id ? `ORD-${id.slice(-6).toUpperCase()}` : '');

const STATUS_CONFIG = {
  pending: {label: 'PENDING', bg: '#FFF3CD', text: '#856404', step: 0},
  processing: {label: 'PROCESSING', bg: '#E8EAF6', text: '#3949AB', step: 1},
  shipped: {label: 'SHIPPED', bg: '#E3F2FD', text: '#1565C0', step: 1},
  delivered: {label: 'DELIVERED', bg: '#E8F5E9', text: '#2E7D32', step: 2},
  cancelled: {label: 'CANCELLED', bg: '#FFEBEE', text: '#C62828', step: -1},
};

const getStatusCfg = status =>
  STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;

// ─────────────────────────────────────────────────────────────
//  LOADING / ERROR
// ─────────────────────────────────────────────────────────────
const LoadingView = () => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color="#1A237E" />
    <Text style={styles.loadingText}>Loading orders...</Text>
  </View>
);

const ErrorView = () => (
  <View style={styles.center}>
    <Text style={styles.errorEmoji}>⚠️</Text>
    <Text style={styles.errorText}>Failed to load orders</Text>
    <Text style={styles.errorSub}>
      Please check your connection and try again
    </Text>
  </View>
);

const EmptyView = ({isOwner}) => (
  <View style={styles.center}>
    <Text style={styles.emptyEmoji}>{isOwner ? '📦' : '🛍️'}</Text>
    <Text style={styles.emptyTitle}>No orders yet</Text>
    <Text style={styles.emptySub}>
      {isOwner
        ? 'Customer orders will appear here'
        : 'Your orders will appear here'}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────
//  TRACKING PROGRESS BAR  (Customer view)
// ─────────────────────────────────────────────────────────────
const TrackingBar = ({status}) => {
  const cfg = getStatusCfg(status);
  const step = cfg.step < 0 ? 0 : cfg.step; // cancelled → show placed
  const steps = ['PLACED', 'SHIPPED', 'DELIVERED'];

  return (
    <View style={trackStyles.wrap}>
      {steps.map((s, i) => {
        const done = i <= step;
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={s}>
            <View style={trackStyles.stepWrap}>
              <View style={[trackStyles.dot, done && trackStyles.dotDone]}>
                {done && i < step && <Text style={trackStyles.check}>✓</Text>}
                {done && i === step && <View style={trackStyles.innerDot} />}
              </View>
              <Text style={[trackStyles.label, done && trackStyles.labelDone]}>
                {s}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[trackStyles.line, i < step && trackStyles.lineDone]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
//  CUSTOMER ORDER CARD
// ─────────────────────────────────────────────────────────────
const CustomerOrderCard = ({order}) => {
  const cfg = getStatusCfg(order.orderStatus);

  return (
    <View style={custStyles.card}>
      {/* Store Header */}
      <View style={custStyles.storeRow}>
        {order.storeDetails?.storeLogo ? (
          <Image
            source={{uri: order.storeDetails.storeLogo}}
            style={custStyles.storeLogo}
          />
        ) : (
          <View style={[custStyles.storeLogo, custStyles.logoFallback]}>
            <Text style={custStyles.logoFallbackText}>🏪</Text>
          </View>
        )}
        <View style={custStyles.storeInfo}>
          <Text style={custStyles.storeName}>
            {order.storeDetails?.storeName || 'Store'}
          </Text>
          <Text style={custStyles.orderId}>{shortId(order._id)}</Text>
        </View>
        <View style={[custStyles.statusBadge, {backgroundColor: cfg.bg}]}>
          <Text style={[custStyles.statusText, {color: cfg.text}]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      <Text style={custStyles.dateText}>📅 {formatDate(order.createdAt)}</Text>

      {/* Items */}
      <View style={custStyles.divider} />
      <Text style={custStyles.sectionLabel}>
        Order Details ({order.items?.length || 0} Items)
      </Text>

      {order.items?.map((item, idx) => (
        <View key={item._id || idx} style={custStyles.itemCard}>
          {/* Item Row */}
          <View style={custStyles.itemRow}>
            {item.productImages?.[0] ? (
              <Image
                source={{uri: item.productImages[0]}}
                style={custStyles.productImg}
              />
            ) : (
              <View style={[custStyles.productImg, custStyles.imgFallback]}>
                <Text style={custStyles.imgFallbackText}>📦</Text>
              </View>
            )}
            <View style={custStyles.itemInfo}>
              <Text style={custStyles.productName} numberOfLines={2}>
                {item.productName || `Product #${idx + 1}`}
              </Text>
              {item.color && (
                <Text style={custStyles.itemMeta}>Color: {item.color}</Text>
              )}
              {item.size && (
                <Text style={custStyles.itemMeta}>Size: {item.size}</Text>
              )}
              <Text style={custStyles.itemMeta}>Qty: {item.quantity}</Text>
            </View>
            <View style={custStyles.itemPrice}>
              {item.price != null ? (
                <Text style={custStyles.priceText}>
                  ${item.price?.toFixed(2)}
                </Text>
              ) : (
                <Text style={custStyles.priceNA}>–</Text>
              )}
            </View>
          </View>

          {/* ← Per-item tracking bar using itemStatus */}
          <View style={custStyles.itemTrackWrap}>
            <TrackingBar status={item.itemStatus || order.orderStatus} />
          </View>

          {/* Item payment status badge */}
          {item.itemPaymentStatus && (
            <View style={custStyles.itemPayRow}>
              <View style={custStyles.itemPayBadge}>
                <Text style={custStyles.itemPayText}>
                  💳 {item.itemPaymentStatus?.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
        </View>
      ))}

      {/* Order Summary */}
      <View style={custStyles.summary}>
        <View style={custStyles.summaryRow}>
          <Text style={custStyles.summaryKey}>Subtotal</Text>
          <Text style={custStyles.summaryVal}>
            ${order.totalAmount?.toFixed(2)}
          </Text>
        </View>
        <View style={custStyles.summaryRow}>
          <Text style={custStyles.summaryKey}>Shipping & Handling</Text>
          <Text style={[custStyles.summaryVal, custStyles.free]}>
            {order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost}`}
          </Text>
        </View>
        <View style={[custStyles.summaryRow, custStyles.totalRow]}>
          <Text style={custStyles.totalKey}>Total</Text>
          <Text style={custStyles.totalVal}>
            ${order.finalAmount?.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};
// ─────────────────────────────────────────────────────────────
//  CUSTOMER ORDER SCREEN
// ─────────────────────────────────────────────────────────────
const CustomerOrderScreen = ({orders}) => (
  <View style={custStyles.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />

    {/* Header */}
    <View style={custStyles.header}>
      <View style={custStyles.headerLeft}>
        <View style={custStyles.gridIcon}>
          <View style={custStyles.gridRow}>
            <View style={custStyles.gridDot} />
            <View style={custStyles.gridDot} />
          </View>
          <View style={custStyles.gridRow}>
            <View style={custStyles.gridDot} />
            <View style={custStyles.gridDot} />
          </View>
        </View>
        <Text style={custStyles.headerTitle}>Order Hub</Text>
      </View>
      <TouchableOpacity style={custStyles.helpBtn}>
        <Text style={custStyles.helpText}>Need Help?</Text>
      </TouchableOpacity>
    </View>

    {orders.length === 0 ? (
      <EmptyView isOwner={false} />
    ) : (
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={({item}) => <CustomerOrderCard order={item} />}
        contentContainerStyle={custStyles.listContent}
        showsVerticalScrollIndicator={false}
      />
    )}
  </View>
);

// ─────────────────────────────────────────────────────────────
//  OWNER ORDER CARD
// ─────────────────────────────────────────────────────────────
const OwnerOrderCard = ({order}) => {
  const navigation = useNavigation();

  const cfg = getStatusCfg(order.orderStatus);
  const itemsLabel = order.items
    ?.slice(0, 2)
    .map(i => i.productName || 'Item')
    .join(', ');
  const extraCount = (order.items?.length || 0) - 2;

  const handleViewMore = () => {
    navigation.navigate('Store_OrderViewMoreScreen', {
      order: order,
      orderId: order._id,
    });
  };

  return (
    <View style={ownStyles.card}>
      {/* Customer Header */}
      <View style={ownStyles.custRow}>
        {order.customerDetails?.avatar ? (
          <Image
            source={{uri: order.customerDetails.avatar}}
            style={ownStyles.avatar}
          />
        ) : (
          <View style={[ownStyles.avatar, ownStyles.avatarFallback]}>
            <Text style={ownStyles.avatarText}>
              {(order.customerName ||
                order.customerDetails?.fullName ||
                'C')[0].toUpperCase()}
            </Text>
          </View>
        )}

        <View style={ownStyles.custInfo}>
          <Text style={ownStyles.custName}>
            {order.customerName ||
              order.customerDetails?.fullName ||
              'Customer'}
          </Text>
          <Text style={ownStyles.orderId}>{shortId(order._id)}</Text>
          <Text style={ownStyles.orderDate}>
            📅 {formatDate(order.createdAt)}
          </Text>
        </View>

        <View style={[ownStyles.badge, {backgroundColor: cfg.bg}]}>
          <Text style={[ownStyles.badgeText, {color: cfg.text}]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* Items Summary */}
      <View style={ownStyles.itemsBox}>
        <Text style={ownStyles.bagIcon}>🛍️</Text>
        <View style={ownStyles.itemsInfo}>
          <Text style={ownStyles.itemsLabel} numberOfLines={2}>
            {order.items?.length} Item{order.items?.length !== 1 ? 's' : ''}:{' '}
            <Text style={ownStyles.itemNames}>
              {itemsLabel}
              {extraCount > 0 ? '...' : ''}
            </Text>
          </Text>
        </View>
        <View style={ownStyles.amountBox}>
          <Text style={ownStyles.amountLabel}>TOTAL{'\n'}AMOUNT</Text>
          <Text style={ownStyles.amountVal}>
            ${order.finalAmount?.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Customer Address / Notes */}
      {(order.customerAddress || order.notes) && (
        <View style={ownStyles.noteRow}>
          {order.customerAddress && (
            <Text style={ownStyles.noteText}>📍 {order.customerAddress}</Text>
          )}
          {order.notes && (
            <Text style={ownStyles.noteText}>💬 {order.notes}</Text>
          )}
        </View>
      )}

      {/* Payment Row */}
      <View style={ownStyles.payRow}>
        <View style={ownStyles.payBadge}>
          <Text style={ownStyles.payText}>
            {order.paymentMethod?.toUpperCase()} ·{' '}
            {order.paymentStatus?.toUpperCase()}
          </Text>
        </View>
        {order.shippingCost === 0 && (
          <Text style={ownStyles.freeShip}>🚚 Free Shipping</Text>
        )}
      </View>

      {/* Contact Info */}
      {(order.customerEmail || order.customerPhone) && (
        <View style={ownStyles.contactRow}>
          {order.customerEmail && (
            <Text style={ownStyles.contactText} numberOfLines={1}>
              ✉️ {order.customerEmail}
            </Text>
          )}
          {order.customerPhone && (
            <Text style={ownStyles.contactText}>📞 {order.customerPhone}</Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={ownStyles.footer}>
        {extraCount > 0 && (
          <View style={ownStyles.extraBadge}>
            <Text style={ownStyles.extraText}>+{extraCount}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => {
            handleViewMore;
          }}
          style={ownStyles.viewBtn}>
          <Text style={ownStyles.viewBtnText}>View More ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
//  OWNER ORDER SCREEN
// ─────────────────────────────────────────────────────────────
const OwnerOrderScreen = ({orders}) => {
  const totalSales = orders.reduce((acc, o) => acc + (o.finalAmount || 0), 0);
  const pendingCount = orders.filter(o => o.orderStatus === 'pending').length;

  return (
    <View style={ownStyles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F2F8" />

      {/* Header */}
      <View style={ownStyles.header}>
        <TouchableOpacity>
          <Text style={ownStyles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={ownStyles.headerTitle}>Order Management</Text>
        <View style={{width: 24}} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        ListHeaderComponent={() => (
          <>
            {/* Hero */}
            <View style={ownStyles.hero}>
              <Text style={ownStyles.heroTitle}>Active Shipments</Text>
              <Text style={ownStyles.heroSub}>
                Manage your commercial logistics and customer fulfillment flow.
              </Text>
            </View>
          </>
        )}
        renderItem={({item}) => <OwnerOrderCard order={item} />}
        ListEmptyComponent={<EmptyView isOwner={true} />}
        ListFooterComponent={() =>
          orders.length > 0 ? (
            <>
              {/* Inventory Pulse */}
              <View style={ownStyles.pulseSection}>
                <Text style={ownStyles.pulseSectionTitle}>INVENTORY PULSE</Text>

                <View style={ownStyles.pulseCard}>
                  <View style={ownStyles.pulseRow}>
                    <Text style={ownStyles.pulseLabel}>Weekly Target</Text>
                    <Text style={ownStyles.pulsePct}>82%</Text>
                  </View>
                  <View style={ownStyles.progressBg}>
                    <View style={[ownStyles.progressFill, {width: '82%'}]} />
                  </View>

                  <View style={ownStyles.statsRow}>
                    <View style={ownStyles.statBox}>
                      <Text style={ownStyles.statLabel}>TOTAL SALES</Text>
                      <Text style={ownStyles.statVal}>
                        $
                        {totalSales >= 1000
                          ? `${(totalSales / 1000).toFixed(1)}k`
                          : totalSales.toFixed(0)}
                      </Text>
                    </View>
                    <View style={ownStyles.statDivider} />
                    <View style={ownStyles.statBox}>
                      <Text style={ownStyles.statLabel}>OPEN ORDERS</Text>
                      <Text style={ownStyles.statVal}>{pendingCount}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Urgent Actions */}
              <View style={ownStyles.urgentSection}>
                <Text style={ownStyles.urgentTitle}>URGENT ACTIONS</Text>
                <View style={ownStyles.urgentCard}>
                  {pendingCount > 0 && (
                    <View style={ownStyles.urgentRow}>
                      <View
                        style={[
                          ownStyles.urgentDot,
                          {backgroundColor: '#EF5350'},
                        ]}
                      />
                      <Text style={ownStyles.urgentText}>
                        Review {pendingCount} pending order
                        {pendingCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  <View style={ownStyles.urgentRow}>
                    <View
                      style={[
                        ownStyles.urgentDot,
                        {backgroundColor: '#EF5350'},
                      ]}
                    />
                    <Text style={ownStyles.urgentText}>
                      Check inventory levels
                    </Text>
                  </View>
                  <View style={ownStyles.urgentRow}>
                    <View
                      style={[
                        ownStyles.urgentDot,
                        {backgroundColor: '#1565C0'},
                      ]}
                    />
                    <Text style={ownStyles.urgentText}>
                      Review new customer messages
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : null
        }
        contentContainerStyle={ownStyles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity style={ownStyles.fab}>
        <Text style={ownStyles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
//  ROOT COMPONENT
// ─────────────────────────────────────────────────────────────
const store_OrderScreen = ({GetStoreById}) => {
  const {isStoreOwner} = useContext(StoreOwnerContext);
  const {ownerId} = useContext(OwnerContext);
  const storeOwner = false;
  // isStoreOwner == GetStoreById?.data?.data?._id

  const userId = ownerId;

  console.log('storeId comes from store data', GetStoreById?.data?.data?._id);
  console.log('storeId comes from storeonwer context', isStoreOwner);
  console.log('store id comparison result', storeOwner);
  console.log('userId from owner context', userId);

  const storeId = GetStoreById?.data?.data?._id;

  const ownerOrders = useGetOrders({
    storeId,
    enabled: storeOwner, // ← only fires when storeOwner is true
  });
  const customerOrders = useGetCustomerOrdersbyStoreId(
    {
      storeId,
      enabled: !storeOwner, // ← only fires when storeOwner is false
    },
    // userId
  );

  const {data, isLoading, isError} = storeOwner ? ownerOrders : customerOrders;

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorView />;

  const orders = data?.data?.data?.orders || []; // ← match your actual API response
  return storeOwner ? (
    <OwnerOrderScreen orders={orders} />
  ) : (
    <CustomerOrderScreen orders={orders} />
  );
};

export default store_OrderScreen;

// ─────────────────────────────────────────────────────────────
//  TRACKING STYLES
// ─────────────────────────────────────────────────────────────
const trackStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  stepWrap: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BDBDBD',
  },
  dotDone: {
    backgroundColor: '#1A237E',
    borderColor: '#1A237E',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  check: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 9,
    color: '#9E9E9E',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  labelDone: {
    color: '#1A237E',
  },
  line: {
    flex: 1,
    height: 3,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
    marginHorizontal: 2,
  },
  lineDone: {
    backgroundColor: '#1A237E',
  },
});

// ─────────────────────────────────────────────────────────────
//  CUSTOMER STYLES
// ─────────────────────────────────────────────────────────────
const custStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#EEF2FF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gridIcon: {
    gap: 3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 3,
  },
  gridDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: '#1A237E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
    letterSpacing: 0.3,
  },
  helpBtn: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpText: {
    fontSize: 13,
    color: '#3949AB',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1A237E',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontSize: 20,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  orderId: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  dateText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 10,
  },
  productImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  imgFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgFallbackText: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  itemMeta: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  priceNA: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  trackWrap: {
    paddingHorizontal: 4,
    marginVertical: 8,
  },
  summary: {
    backgroundColor: '#F8F9FF',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    fontSize: 13,
    color: '#757575',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  free: {
    color: '#1A237E',
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E8EAF6',
    paddingTop: 8,
    marginTop: 4,
  },
  totalKey: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A237E',
  },
});

// ─────────────────────────────────────────────────────────────
//  OWNER STYLES
// ─────────────────────────────────────────────────────────────
const ownStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F2F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F0F2F8',
  },
  menuIcon: {
    fontSize: 22,
    color: '#1A237E',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A237E',
  },
  hero: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0D0D1A',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 14,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1A237E',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 10,
  },
  custRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8EAF6',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A237E',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  custInfo: {
    flex: 1,
  },
  custName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D0D1A',
  },
  orderId: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 1,
  },
  orderDate: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  itemsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  bagIcon: {
    fontSize: 22,
  },
  itemsInfo: {
    flex: 1,
  },
  itemsLabel: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
  itemNames: {
    fontWeight: '600',
    color: '#1A1A2E',
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 9,
    color: '#9E9E9E',
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'right',
    lineHeight: 12,
  },
  amountVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A1A2E',
    marginTop: 2,
  },
  noteRow: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#5D4037',
    lineHeight: 16,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  payText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.3,
  },
  freeShip: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactText: {
    fontSize: 11,
    color: '#757575',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  extraBadge: {
    backgroundColor: '#E8EAF6',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3949AB',
  },
  viewBtn: {
    backgroundColor: '#1A237E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    flex: 1,
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  // ── Inventory Pulse ──
  pulseSection: {
    marginTop: 20,
  },
  pulseSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E9E9E',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  pulseCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#1A237E',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pulseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  pulsePct: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A237E',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#E8EAF6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A237E',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9E9E9E',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  // ── Urgent Actions ──
  urgentSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  urgentTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E9E9E',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  urgentCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#1A237E',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '500',
  },
  // new
  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A237E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A237E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '300',
    lineHeight: 32,
  },
  // ← Add these at the bottom of custStyles
  itemCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  itemTrackWrap: {
    paddingHorizontal: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  itemPayRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  itemPayBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  itemPayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.3,
  },
});

// ─────────────────────────────────────────────────────────────
//  SHARED STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F8',
    gap: 8,
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 10,
  },
  errorEmoji: {fontSize: 40},
  errorText: {fontSize: 18, fontWeight: '700', color: '#1A1A2E'},
  errorSub: {fontSize: 13, color: '#9E9E9E', textAlign: 'center'},
  emptyEmoji: {fontSize: 50},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginTop: 8},
  emptySub: {fontSize: 13, color: '#9E9E9E', textAlign: 'center'},

  // new
});

// import {StyleSheet, Text, View} from 'react-native';
// import React, {useContext} from 'react';
// import {
//   useGetOrders,
//   useGetCustomerOrders,
// } from '../../ReactQuery/TanStackQueryHooks/storee/useOrder';

// import {StoreOwnerContext} from '../../context/IsStoreOwner';

// const store_OrderScreen = ({GetStoreById}) => {
//   const {isStoreOwner} = useContext(StoreOwnerContext);

//   // ── Call both, use only the relevant one ──
//   const ownerOrders = useGetOrders( storeId: GetStoreById?.data?.data?._id,);
//   const customerOrders = useGetCustomerOrders({
//     storeId: GetStoreById?.data?.data?._id,
//   });

//   const {data, isLoading, isError} = isStoreOwner
//     ? ownerOrders
//     : customerOrders;

//   return (
//     <View>
//       <Text>store_OrderScreen</Text>
//     </View>
//   );
// };

// export default store_OrderScreen;

// const styles = StyleSheet.create({});
