from parsers.cisco_parser import CiscoParser
from utils.file_reader import FileReader

def test_cisco_parser():

    try:
        config = FileReader.read("sample_configs/ciscosafe.txt")
    except Exception:
        config = FileReader.read("sample_configs/cisco_vulnerable.txt")


    parser = CiscoParser()

    device = parser.parse(config)

    assert device.hostname == "R1"
    assert device.vendor == "Cisco"
    assert len(device.interfaces) == 2
