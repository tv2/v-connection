import { createMSE, MSE } from '../../src'
// Mappings
interface VMapping {
}
// Timeline objects
interface VObjectInternal {
    id: '',
    content: {
        deviceType: DeviceType.VizMSE
        type: TimelineContentTypeVizMSE.Element // ??
        templateType: 'internal'
        templateName: string
        templateData: Array<string>
    }
}
interface VObjectPilot {
    id: '',
    content: {
        deviceType: DeviceType.VizMSE
        type: TimelineContentTypeVizMSE.Element // ??
        templateType: 'pilot'
        templateVcpId: number
    }
}
// -------------------------------------------------------
async function initialize (hostname: string, port1: number, port2: number) {
    let i = 0
    // Initializing:
    const device: MSE = createMSE(
        hostName, port1?, port2?
    )
    // create a "rundown" (a playlist)
    const rundowns = device.getRundowns() // check if already exist
    const rundown = await device.createRundown(
        'showId1110001',
        'profileNameSofie'
    )
    const profile = await device.getProfile('sofie')
    // done some time before the element is to be displayed:
    const el = await rundown.listElements()
    // "internal element"
    const internalEl = await rundown.createElement(
        'templateName', 'elementName_rundownName' + (i++), [
            'Johan Nyman',
            'Producer'
        ]
    )
    //  "pilot element"
    const pilotEl = await rundown.createElement(1337, 'myPilotElement')
    // Activation
        // something to be done before starting to use the viz engine
    await rundown.activate()
    // Deactivation
        // something to be done when done with a viz engine
    await rundown.deactivate()
    // queue an element
    await rundown.cue(internalEl.name)
    // play an element:
    await rundown.take(internalEl.name)
    // take out:
    // await rundown.out(internalEl.name)
    await rundown.take(pilotEl.vcpid)
    await rundown.continue(pilotEl.vcpid)
    // Things to look into:
    // health-monitoring
    // "what is it currently displaying" <- nightmare?
    // Nightmares:
    // All-out
    // "CSS" (Trio-pages) - ie "change the style of all gfx elements from now on" eg design_badminton
    // if 3rd party application does something
}










Message Johan Nyman
