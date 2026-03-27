# Bluetooth

To begin you will need a device that is using the correct Service and Characteristics to talk to our mobile app. These UUID values are set in the [`project.config.ts`](../project.config.ts) file. If you don't have a device available, you can enable the mock hardware layer described below. All of the BLE functionality is built around a core abstraction layer found in [`lib/bluetooth/core/bleCore.ts`](../lib/bluetooth/core/bleCore.ts). Here you will find all of the functions necessary to discover, connect, and interact with a device. Below will outline how to leverage the core layer as well as hooks, and api abstractions built ontop of it.

## Requesting permissions

Before ever interacting with bluetooth, you will need to request permissions from the Mobile App user to utilize the radio. The `requestBluetoothPermission` function handles gathering the required permissions for your platform using the latest rules as of the making of this template (March 2026). Expo documentation does a pretty good job at providing the latest checks for a given Expo SDK version. If you migrate versions, be sure to check the documentation for any new permissions requirements.

```ts
const granted = await BleService.requestBluetoothPermission();
```

## Scanning for Devices

Before connecting to a device it will need to be placed into an advertising state and a scan must be initiated from the mobile app. You could initiate a scan using the core function `scanForDevices`, providing a callback fired for every device discovered (note: the same device can fire the discovery callback multiple times in a scan) in addition to an error callback and an `allowList`, which is an array of service UUIDs you expect to find in a devices advertising packets. A simpler approach is to use the [useBleScan](../hooks/useBleScan.ts) which handles requesting permissions, device deduplication, a state flag indicating if you are scanning, and functions to start/stop the scanning. You can reference the [BleScanList](../components/BleScanList.tsx) for a comprehensive example of scanning, displaying discovered devices, and utilizing the `isBleScanning` flag for status indication to a user.

## Connecting to a Device

Once a device is discovered we can connect, again using the core API, or you can use the [`useBleConnection`](../hooks/useBleConnection.ts) hook which provides functions for connecting and disconnecting, as well as a global state flag indicating if a device is connected. Referencing our [BleScanList](../components/BleScanList.tsx) you see we attempt a connection, providing the device UUID we want to connect to, and once connected we navigate to a device page where we will begin interacting with the devices characteristics.

```tsx
const { isBleConnecting, isBleConnected, bleConnect } = useBleConnection();

...

<Pressable
    onPress={async () => {
        const connected = await bleConnect(item.id, 2500);
        if (connected)
            router.navigate({
                pathname: `/device/[deviceId]`,
                params: {
                    deviceId: item.id,
                    deviceName:
                        item.name || 'Unkown Device',
                    rssi: item.rssi
                        ? String(item.rssi)
                        : '',
                },
            });
    }}
>
```

You can also utilize the `useBleConnection` hook purely for the state indication.

```tsx
const { isBleConnected } = useBleConnection();

...

return (
    <Text>{`Device is ${isBleConnected ? 'Connected' : 'Disconnected'}`}</Text>
);
```

## Interacting with Device Characteristics

With an active device connection we can now read and write characteristics and subscribe to characteristic notifications. You can of course do so with the ble core layer, and for general reads and writes this is probably preferred. To keep your components clean and abstracted from BLE interactions it's recommended to wrap these read/writes into an API. Take a look at the [wifiApi](../lib/bluetooth/api/wifi/wifiApi.ts) for an example of how sequential characteristic writes, to connect a device to a new WiFi AP, is wrapped up into a single method that a component can call.

When interacting with devices that are constantly updating data (telemetry, patient information, etc) you will want to utilize notifications. While you can technically use the core API, you will want to use the hooks provided instead as they handle event subscriptions and device connection lifecycle management. If you implement your own hook utilizing notifications, you can reference the [useBleNotify](../hooks/useBleNotify.ts). The notification based hooks will also attempt to `hydrate` themselves at component mount by doing a normal characteristic read. This prevents the UI from showing a blank or loading state while waiting for the first asynchronous notification to arrive from the device.

At the moment two use cases are covered for notification data

- Infrequent state updates, such as a device state, temperature value, etc. For these characteristics you will want to use the `useBleNotify` hook. This provides a simple API to subscribe to a characteristic for a given service and returns a single state variable holding the latest value received from the device.
- Time-series or streamed data. The `useBleStream` hook gives a developer the ability to subscribe to a characteristic and in return is given a windowed (array) state variable with the last X samples received from a device. This is great for telemetry or temperature data that you want to hand directly to a charting component for display. There are several useful configuration params that change the indexing methods, provide custom X and Y axis parsing from the incoming notifications, as well window (data history) configuration and batching configuration. All of which are explained below.
- NOT IMPLEMENTED YET - A coming hook is the `useBleSync` hook which will behave very similarly to `useBleStream` but instead of returning a time series state, you provide a callback to be executed based on the configuration params. An example would be to publish received data to a backend API or syncing to local storage on the mobile device.

### useBleNotify

`useBleNotify` is great for infrequent status updates like a device state or temperature values. A basic use would look like the snippet below where we are subscribing to notifications on the provided service/characteristic which should be returning a number indicating the current temperature.

One important thing to note is that a `parser` function must be provided to parse the actual payload sent by the device. By default, if no parser is provided, the hook will attempt to parse all notified data as a `string`. In our example a `uint8` was provided via the payload. Other examples might be that the data is shared via a JSON object, or CBOR encoded in which you can use the necessary functions or libraries to parse your payload and return a `number` to use in your component (`currentTemp`)

```tsx
const currentTemp = useBleNotify<number>(
    ProjectConfig.ble.services.thermostat.service_uuid,
    ProjectConfig.ble.services.thermostat.current_temp_uuid,
    (dat: Buffer) => {
        return dat.readUint8(0);
    },
);
```

Finally, if a device sends data via notifications at a higher rate than you need for a given component, you can provide a `decimate` configuration which throws away received data and only updates the state every `N` samples. This can help to reduce visual jitter in a component and remove unnecessary component updates.

### useBleStream

`useBleStream` is a powerful hook used for streaming time series data from a device. Similar to the `useBleNotify` you provide a service and characteristic UUID you would like to receive notifications from, provide a parser function to retrieve your data from the incoming notification payload, and the hook will store a history, configured via `maxHistory`, of the data received in an `x,y` format where the `x` value is set according to your configured `strategy` configuration. You can also queue up data into `batches` to reduce excessive screen updates as data streams in. Configuring `batches` does not decimate or delete data. The only time data is discarded is when the samples exceed the `maxHistory` configuration. Below are several examples of data `strategies` and `batching`.

A basic example streaming ecg data, allowing data to be auto-indexed with a sample ID starting from `0`, where the ecgWaveform state is updated every time 10 samples are received, retaining a total of 100 samples. `batchSize` and `maxHistory` will be highly dependent on the rate at which a device updates the characteristics with notifications and how fluid you want the UI to be. The datatype returned in ecgWaveform would be `{x: number, y: number}[]` where X is the auto incremented index and Y is parsed datapoint.

```tsx
const ecgWaveform = useBleStream(
    ProjectConfig.ble.services.ecg.service_uuid,
    ProjectConfig.ble.services.ecg.waveform_uuid,
    (buf: Buffer) => buf.readUInt8(0),
    {
        strategy: 'index',
        batchSize: 10,
        maxHistory: 100,
    },
);
```

The `index` strategy is great for cumulative data where the X axis does not matter, but if you need to instead have a timestamp of when the data was received at the device you can use the `time` strategy which provides a full timestamp via `Date.now()`. The datatype returned in ecgWaveform would be `{x: number, y: number}[]` where X is the Unix timestamp in milliseconds and Y is parsed datapoint.

```tsx
const ecgWaveform = useBleStream(
    ProjectConfig.ble.services.ecg.service_uuid,
    ProjectConfig.ble.services.ecg.waveform_uuid,
    (buf: Buffer) => buf.readUInt8(0),
    {
        strategy: 'time',
        batchSize: 10,
        maxHistory: 100,
    },
);
```

Finally a `custom` strategy can be used to parse the X coordinate information from the received notification. An example being the data and a timestamp is provided from the device in a packed structure. The data could also be wrapped in CBOR or JSON or any other encoding type which requires unpacking. In the example below a 2 byte buffer containing a packed struct with the X (`uint8`) and Y (`uint8`) data is sent every notification. The datatype returned in ecgWaveform would be `{x: number, y: number}[]` where X the parsed x data from the notification payload and Y is the parsed datapoint.

```tsx
const ecgWaveform = useBleStream(
    ProjectConfig.ble.services.ecg.service_uuid,
    ProjectConfig.ble.services.ecg.waveform_uuid,
    (buf: Buffer) => buf.readUInt8(0),
    {
        strategy: 'custom',
        customX: (data, index) => data.readUint8(1),
        batchSize: 10,
        maxHistory: 100,
    },
);
```

## Mock Hardware

You might not always have a real device available for your testing and you'll need to use a simulator. A mock bluetooth layer has been added allowing you to continue developing your UI pertaining to bluetooth interfactions without an actual device. The [Mock bluetooth layer](../lib/bluetooth/MockOutbandBleService.ts) is enabled by default when on a simulator, and can be forced on when using a real device by setting the `useMockService` flag in the [project config](../project.config.ts).

As you add new functionality to your BLE Service, you will want to also add new mock interfaces to ensure everything functions correctly when using the mock device interface. To utilize mock characteristics and notifications you can add a new `MockStreamConfig` entry to the `MOCK_REGISTRY`, providing a function used to generate mock data, and an interval to send notifications should a component subscribe to a characteristic. The below example returns a setpoint value of 68 degress any time a read is done on the setpoint characteristic. If a notification subscription is made, they will be sent every 1000ms.

```ts
    [ProjectConfig.ble.services.thermostat.setpoint_uuid]: {
        intervalMs: 10000,
        generate: () => 68,
    },
```
